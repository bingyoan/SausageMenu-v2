import { ImageOverlayResult, ImageTranslationRegion, MenuItem, MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';
import { Schema, Type } from "@google/genai"; // Import types only
import { getImageTranslationUIText } from '../i18n';
import { Capacitor } from '@capacitor/core';
import { decodeOverlay, overlayPrompt, overlaySchema } from '../lib/overlay';

export const createRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

// =========================================================
// 🛡️ 背景恢復 Fetch — 解決 App 切換到背景時請求卡住的問題
// =========================================================
// 當 Android WebView 被暫停後 fetch 會凍結，即使回到前景也不會恢復。
// 此 wrapper 透過 AbortController + visibilitychange 偵測凍結請求，
// 並在回到前景後自動重試。
const resilientFetch = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = 90000, // 90 秒超時
  maxRetries: number = 1
): Promise<Response> => {
  let attempt = 0;

  const doFetch = (): Promise<Response> => {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout>;
      let wasBackgrounded = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        document.removeEventListener('visibilitychange', onVisChange);
        fn();
      };

      // 偵測 App 返回前景
      const onVisChange = () => {
        if (document.visibilityState === 'hidden') {
          wasBackgrounded = true;
          console.log('[resilientFetch] App went to background during fetch');
        }
        if (document.visibilityState === 'visible' && wasBackgrounded) {
          console.log('[resilientFetch] App resumed — checking fetch health...');
          wasBackgrounded = false;
          // 給原本的 fetch 一小段時間完成（可能 server 已回應但 JS 被凍結了）
          // 如果 3 秒後仍未 settle，視為凍結，中斷並重試
          setTimeout(() => {
            if (!settled) {
              console.warn('[resilientFetch] Fetch appears frozen after resume, aborting & retrying...');
              controller.abort();
              settle(() => {
                attempt++;
                if (attempt <= maxRetries) {
                  console.log(`[resilientFetch] Retry attempt ${attempt}/${maxRetries}`);
                  doFetch().then(resolve, reject);
                } else {
                  reject(new Error('Request failed after app resume retries'));
                }
              });
            }
          }, 3000);
        }
      };

      document.addEventListener('visibilitychange', onVisChange);

      // 超時保護
      timeoutId = setTimeout(() => {
        if (!settled) {
          console.warn(`[resilientFetch] Request timed out after ${timeoutMs}ms`);
          controller.abort();
          settle(() => {
            attempt++;
            if (attempt <= maxRetries) {
              doFetch().then(resolve, reject);
            } else {
              reject(new Error(`Request timed out after ${maxRetries} retries`));
            }
          });
        }
      }, timeoutMs);

      fetch(url, { ...options, signal: controller.signal })
        .then(response => settle(() => resolve(response)))
        .catch(err => {
          if (err.name === 'AbortError') {
            // AbortError 已在上面處理（重試邏輯）
            // 如果 settle 已執行，這裡不會再觸發
            if (!settled) {
              settle(() => {
                attempt++;
                if (attempt <= maxRetries) {
                  doFetch().then(resolve, reject);
                } else {
                  reject(err);
                }
              });
            }
          } else {
            settle(() => reject(err));
          }
        });
    });
  };

  return doFetch();
};

class ManagedGeminiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ManagedGeminiError';
    this.status = status;
    this.code = code;
  }
}

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

interface ManagedGeminiRequestOptions {
  /** Maximum time allowed for one network attempt. */
  timeoutMs?: number;
  /** Retries performed when the app resumes from background or a request times out. */
  fetchRetries?: number;
  /** Retries performed after a retryable HTTP response. */
  maxAttempts?: number;
  /** User-supplied key for the web BYOK flow. Never included in the request body. */
  customApiKey?: string;
}

export const requestManagedGemini = async (
  payload: Record<string, unknown>,
  requestOptions: ManagedGeminiRequestOptions = {}
): Promise<any> => {
  const platform = Capacitor.getPlatform();
  const clientPlatform = platform === 'ios' || platform === 'android' ? platform : 'web';
  const timeoutMs = requestOptions.timeoutMs ?? 90000;
  const fetchRetries = requestOptions.fetchRetries ?? 1;
  const maxAttempts = requestOptions.maxAttempts ?? 2;
  const customApiKey = requestOptions.customApiKey?.trim();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response: Response;
    try {
      response = await resilientFetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-custom-api-key': customApiKey } : {}),
        },
        body: JSON.stringify({ ...payload, clientPlatform }),
      }, timeoutMs, fetchRetries);
    } catch (error: any) {
      const message = String(error?.message || error || '').toLowerCase();
      if (message.includes('timed out') || message.includes('failed after app resume')) {
        const isOverlay = payload.responseMode === 'overlay';
        throw new ManagedGeminiError(
          isOverlay
            ? '圖片辨識逾時，請改用較清楚或裁切後的圖片再試。'
            : 'AI 翻譯連線逾時，請稍後再試。',
          408,
          'AI_TIMEOUT'
        );
      }
      throw error;
    }

    if (response.ok) return response.json();

    const errorData = await response.json().catch(() => ({}));
    const error = new ManagedGeminiError(
      errorData.error || '菜單生成失敗，請稍後再試。',
      response.status,
      errorData.code
    );
    const retryable = [408, 500, 502, 504].includes(response.status);
    if (!retryable || attempt === maxAttempts) throw error;
    await wait(1000 * Math.pow(2, attempt));
  }
};

// Schema definition
const menuSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    restaurantName: { type: Type.STRING, description: "Name of the restaurant if visible on the menu." },
    originalCurrency: { type: Type.STRING, description: "The currency code found on the menu (e.g., JPY, EUR, USD)." },
    exchangeRate: { type: Type.NUMBER, description: "Real-time exchange rate: 1 unit of Menu Currency = X units of Target Currency." },
    detectedLanguage: { type: Type.STRING, description: "The primary language detected on the menu." },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalName: { type: Type.STRING, description: "EXACT dish name as printed in the source menu language. Preserve accents, diacritics, and original script. Never translate this field." },
          translatedName: { type: Type.STRING, description: "Natural translation of originalName in the requested target language." },
          price: { type: Type.NUMBER, description: "Base price. If price is missing or illegible, return 0." },
          category: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            description: "Variants like sizes (Small/Large) or add-ons listed with the item.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER }
              }
            }
          },
          shortDescription: { type: Type.STRING, description: "Brief description (5-8 words)." },
          allergy_warning: { type: Type.BOOLEAN, description: "True if contains common allergens." },
          allergens: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Detect if item definitely contains: Beef, Pork, Peanuts, Shrimp, Seafood, Coriander, Nuts, Soy, Eggs, Milk."
          },
          dietary_tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Tags: Spicy, Vegan, Veg, Gluten-Free."
          }
        },
        required: ["originalName", "translatedName", "price", "category"],
      },
    },
  },
  required: ["items", "originalCurrency", "exchangeRate", "detectedLanguage"],
};

export const parseImageOverlay = async (
  base64Image: string,
  targetLanguage: TargetLanguage,
  usageBatchId?: string,
  customApiKey?: string
): Promise<ImageOverlayResult> => {
  const imageTranslationUi = getImageTranslationUIText(targetLanguage);
  const result = await requestManagedGemini({
    requestId: createRequestId(), usageBatchId, usageKind: 'menu',
    responseMode: 'overlay', targetLanguage, pageCount: 1,
    contents: { parts: [
      { text: overlayPrompt(targetLanguage) },
      { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
    ] },
    config: { responseMimeType: 'application/json', responseSchema: overlaySchema },
  }, { timeoutMs: 55000, fetchRetries: 0, maxAttempts: 1, customApiKey });
  const decoded = decodeOverlay(result?.text || '');
  if (!decoded.regions.length) throw new Error(imageTranslationUi.noTextFound);
  return { ...decoded, partial: result.partial || decoded.partial, usageMetadata: result.usageMetadata };
};

export const parseMenuImage = async (
  base64Images: string[],
  targetLanguage: TargetLanguage,
  customApiKey?: string
): Promise<MenuData> => {
  // DEBUG: Log the target language to verify it's being passed correctly
  console.log('[parseMenuImage] Target Language:', targetLanguage);

  const targetCurrency = getTargetCurrency(targetLanguage);
  const prompt = `
    *** CRITICAL: RETURN A BILINGUAL MENU ***
    
    Analyze these menu images (Total: ${base64Images.length} images).
    ABSOLUTE REQUIREMENT:
    - originalName MUST contain the exact dish name printed in the source menu language. Preserve Czech/Japanese/other accents and script; never translate, romanize, or replace it.
    - translatedName MUST be the natural translation of originalName in ${targetLanguage}
    - ALL descriptions (description field) MUST be in ${targetLanguage}
    - ALL category names (category field) MUST be in ${targetLanguage}
    - ALL option names MUST be in ${targetLanguage}
    - The original-language exception is mandatory for originalName (and restaurantName when copied from the image)
    
    *** CONTEXTUAL TRANSLATION — MOST IMPORTANT ***
    Before translating individual items, FIRST identify:
    1. The RESTAURANT TYPE (e.g., yakitori/串焼き, sushi, ramen, Thai, Italian, etc.)
    2. The CUISINE CONTEXT from surrounding menu items
    Then use this context to translate EVERY item accurately:
    - Use the restaurant type to disambiguate terms. Example: "ミンチ" in a yakitori restaurant = chicken mince skewer (つくね), NOT "mince meatball"
    - "つくね" = chicken meatball skewer, "ねぎま" = chicken and scallion skewer
    - Use NATURAL food terminology that a native ${targetLanguage} speaker would use at a restaurant, NOT awkward literal translations
    - If the menu item is a well-known dish (e.g., "パッタイ" = Pad Thai, "カルボナーラ" = Carbonara), use the commonly recognized name
    - For Japanese izakaya/yakitori items, understand that items are typically served as skewers (串) unless stated otherwise
    - Consider portion descriptions like "2本で一皿" = "2 skewers per serving" and reflect this in the description
    
    CRITICAL OBJECTIVE: EXTRACT EVERY SINGLE MENU ITEM VISIBLE.
    1. STRICT OCR & ROBUSTNESS: Extract text EXACTLY as seen, then TRANSLATE to ${targetLanguage} with proper context. If price is missing, set to 0.
    2. DUAL PRICING / VARIANTS: Handle sizes/add-ons as options.
    3. OUTPUT FORMAT: Group by category. Keep originalName in the source language; translate user-facing explanation fields to ${targetLanguage}.
    4. CURRENCY & EXCHANGE:
       - Detected "originalCurrency" MUST be a 3-letter ISO 4217 code (e.g., JPY, USD, THB).
       - Detected "exchangeRate" is an estimate of: 1 unit of Menu Currency = X units of ${targetCurrency}.
    5. DIETARY & ALLERGY: Detect allergens (Beef, Pork, Peanuts, etc). Allergen names MUST be in ${targetLanguage}.
    
    FINAL REMINDER: Each item must be bilingual: originalName = exact source text, translatedName = ${targetLanguage}. Do not put the ${targetLanguage} translation into originalName.
    Return pure JSON adhering to the schema.
  `;

  const parts: any[] = [{ text: prompt }];
  base64Images.forEach(img => {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
  });

  const requestId = createRequestId();

  try {
    const result = await requestManagedGemini({
      requestId,
      usageKind: 'menu',
      pageCount: base64Images.length,
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: menuSchema,
        systemInstruction: `You are an expert bilingual menu digitizer. Preserve each dish's exact source-language text in originalName, including accents and original script. Put its natural ${targetLanguage} translation in translatedName. Translate descriptions, categories, options, allergens, and dietary tags to ${targetLanguage}. Never translate or replace originalName.`
      }
    }, { customApiKey });
    const text = result.text;
    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);

    const originalCode = (parsed.originalCurrency || 'USD').trim().toUpperCase();
    const targetCode = (targetCurrency || 'TWD').trim().toUpperCase();
    let finalRate = parsed.exchangeRate || 1;

    try {
      // 嘗試從我們的 Rates API 取得最準確的即時匯率
      const rateRes = await fetch('/api/rates');
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        if (rateData.rates) {
          const originalToTwd = rateData.rates[originalCode];
          const targetToTwd = rateData.rates[targetCode];

          if (originalToTwd && targetToTwd) {
            // 計算公式: (1 原幣 = X 台幣) / (1 目標幣 = Y 台幣) = 1 原幣 = (X/Y) 目標幣
            // 這樣能處理任意兩種貨幣之間的轉換
            finalRate = originalToTwd / targetToTwd;
            console.log(`[GeminiService] API Rate Applied: 1 ${originalCode} = ${finalRate} ${targetCode}`);
          }
        }
      }
    } catch (e) {
      console.warn("[GeminiService] Failed to fetch live rates, falling back to AI estimate", e);
    }

    const itemsWithIds = (parsed.items || []).map((item: any, index: number) => ({
      ...item,
      originalName: String(item.originalName || '').trim(),
      translatedName: String(item.translatedName || item.originalName || '').trim(),
      id: `item-${index}-${Date.now()}`,
      category: item.category || 'General',
    }));

    return {
      items: itemsWithIds,
      originalCurrency: originalCode,
      targetCurrency: targetCode,
      exchangeRate: finalRate,
      detectedLanguage: parsed.detectedLanguage || 'Unknown',
      restaurantName: parsed.restaurantName,
      usageMetadata: result.usageMetadata
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

/**
 * ⭐ 逐頁處理菜單 — 方案 A+B
 * 一次處理一頁圖片，透過 callback 回傳漸進式結果
 * 大幅提升使用者體驗（不需等全部完成）
 */
export const parseMenuPageByPage = async (
  base64Images: string[],
  targetLanguage: TargetLanguage,
  onPageComplete: (currentData: MenuData, pageIndex: number, totalPages: number) => void,
  onPageStart?: (pageIndex: number, totalPages: number) => void,
  customApiKey?: string
): Promise<MenuData> => {
  console.log(`[parseMenuPageByPage] Starting: ${base64Images.length} pages, lang: ${targetLanguage}`);
  const usageBatchId = createRequestId();

  const targetCurrency = getTargetCurrency(targetLanguage);
  // 累積結果
  let allItems: MenuItem[] = [];
  let finalCurrency = '';
  let finalRate = 1;
  let finalDetectedLang = '';
  let finalRestaurantName = '';
  let itemIdCounter = 0;

  for (let i = 0; i < base64Images.length; i++) {
    const isFirstPage = i === 0;

    // 通知開始處理第 N 頁
    onPageStart?.(i, base64Images.length);

    const pagePrompt = `
      *** CRITICAL: RETURN A BILINGUAL MENU ***
      
      Analyze this menu image (Page ${i + 1} of ${base64Images.length}).
      ABSOLUTE REQUIREMENT:
      - originalName MUST contain the exact dish name printed in the source menu language. Preserve Czech/Japanese/other accents and script; never translate, romanize, or replace it.
      - translatedName MUST be the natural translation of originalName in ${targetLanguage}
      - ALL descriptions (description field) MUST be in ${targetLanguage}
      - ALL category names (category field) MUST be in ${targetLanguage}
      - ALL option names MUST be in ${targetLanguage}
      - The original-language exception is mandatory for originalName (and restaurantName when copied from the image)
      
      *** CONTEXTUAL TRANSLATION — MOST IMPORTANT ***
      Before translating individual items, FIRST identify:
      1. The RESTAURANT TYPE (e.g., yakitori/串焼き, sushi, ramen, Thai, Italian, etc.)
      2. The CUISINE CONTEXT from surrounding menu items
      Then use this context to translate EVERY item accurately:
      - Use the restaurant type to disambiguate terms. Example: "ミンチ" in a yakitori restaurant = chicken mince skewer (つくね), NOT "mince meatball"
      - "つくね" = chicken meatball skewer, "ねぎま" = chicken and scallion skewer
      - Use NATURAL food terminology that a native ${targetLanguage} speaker would use at a restaurant, NOT awkward literal translations
      - If the menu item is a well-known dish (e.g., "パッタイ" = Pad Thai, "カルボナーラ" = Carbonara), use the commonly recognized name
      - For Japanese izakaya/yakitori items, understand that items are typically served as skewers (串) unless stated otherwise
      - Consider portion descriptions like "2本で一皿" = "2 skewers per serving" and reflect this in the description
      
      CRITICAL OBJECTIVE: EXTRACT EVERY SINGLE MENU ITEM VISIBLE ON THIS PAGE.
      1. STRICT OCR & ROBUSTNESS: Extract text EXACTLY as seen, then TRANSLATE to ${targetLanguage} with proper context. If price is missing, set to 0.
      2. DUAL PRICING / VARIANTS: Handle sizes/add-ons as options.
      3. OUTPUT FORMAT: Group by category. Keep originalName in the source language; translate user-facing explanation fields to ${targetLanguage}.
      4. CURRENCY & EXCHANGE:
         - Detected "originalCurrency" MUST be a 3-letter ISO 4217 code (e.g., JPY, USD, THB).
         - Detected "exchangeRate" is an estimate of: 1 unit of Menu Currency = X units of ${targetCurrency}.
      5. DIETARY & ALLERGY: Detect allergens (Beef, Pork, Peanuts, etc). Allergen names MUST be in ${targetLanguage}.
      
      FINAL REMINDER: Each item must be bilingual: originalName = exact source text, translatedName = ${targetLanguage}. Do not put the ${targetLanguage} translation into originalName.
      Return pure JSON adhering to the schema.
    `;

    const parts: any[] = [
      { text: pagePrompt },
      { inlineData: { mimeType: 'image/jpeg', data: base64Images[i] } }
    ];
    const requestId = createRequestId();

    try {
      const result = await requestManagedGemini({
          requestId,
          usageBatchId,
          usageKind: 'menu',
          pageCount: 1,
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: menuSchema,
            systemInstruction: `You are an expert bilingual menu digitizer. Preserve each dish's exact source-language text in originalName, including accents and original script. Put its natural ${targetLanguage} translation in translatedName. Translate descriptions, categories, options, allergens, and dietary tags to ${targetLanguage}. Never translate or replace originalName.`
          }
      }, { customApiKey });
      const text = result.text;
      if (!text) {
        console.warn(`[Page ${i + 1}] No response text, skipping`);
        continue;
      }

      const parsed = JSON.parse(text);

      // 第一頁取得基本資訊
      if (isFirstPage) {
        finalCurrency = (parsed.originalCurrency || 'USD').trim().toUpperCase();
        finalDetectedLang = parsed.detectedLanguage || 'Unknown';
        finalRestaurantName = parsed.restaurantName || '';
        finalRate = parsed.exchangeRate || 1;

        // 取得即時匯率
        try {
          const originalCode = finalCurrency;
          const targetCode = (targetCurrency || 'TWD').trim().toUpperCase();
          const rateRes = await fetch('/api/rates');
          if (rateRes.ok) {
            const rateData = await rateRes.json();
            if (rateData.rates) {
              const originalToTwd = rateData.rates[originalCode];
              const targetToTwd = rateData.rates[targetCode];
              if (originalToTwd && targetToTwd) {
                finalRate = originalToTwd / targetToTwd;
                console.log(`[Page 1] API Rate: 1 ${originalCode} = ${finalRate} ${targetCode}`);
              }
            }
          }
        } catch (e) {
          console.warn("[Page 1] Failed to fetch rates, using AI estimate", e);
        }
      } else {
        // 後續頁如果偵測到餐廳名而第一頁沒有
        if (!finalRestaurantName && parsed.restaurantName) {
          finalRestaurantName = parsed.restaurantName;
        }
      }

      // 處理本頁菜品並加入累積列表
      const pageItems = (parsed.items || []).map((item: any) => ({
        ...item,
        originalName: String(item.originalName || '').trim(),
        translatedName: String(item.translatedName || item.originalName || '').trim(),
        id: `item-${itemIdCounter++}-${Date.now()}`,
        category: item.category || 'General',
      }));

      allItems = [...allItems, ...pageItems];
      console.log(`[Page ${i + 1}] Found ${pageItems.length} items (total: ${allItems.length})`);

      // 回傳漸進式結果
      const currentData: MenuData = {
        items: allItems,
        originalCurrency: finalCurrency,
        targetCurrency: (targetCurrency || 'TWD').trim().toUpperCase(),
        exchangeRate: finalRate,
        detectedLanguage: finalDetectedLang,
        restaurantName: finalRestaurantName,
      };

      onPageComplete(currentData, i, base64Images.length);

    } catch (error) {
      console.error(`[Page ${i + 1}] Error:`, error);
      if (error instanceof ManagedGeminiError) throw error;
      // A malformed individual page can be skipped; service failures cannot.
    }
  }

  // 如果完全沒有結果
  if (allItems.length === 0) {
    throw new Error("No items could be extracted from any page.");
  }

  return {
    items: allItems,
    originalCurrency: finalCurrency,
    targetCurrency: (targetCurrency || 'TWD').trim().toUpperCase(),
    exchangeRate: finalRate,
    detectedLanguage: finalDetectedLang,
    restaurantName: finalRestaurantName,
  };
};

export const explainDish = async (
  dishName: string,
  originalLang: string,
  targetLang: TargetLanguage
): Promise<string> => {
  try {
    const result = await requestManagedGemini({
        requestId: createRequestId(),
        usageKind: 'explain',
        pageCount: 1,
        contents: {
          parts: [{ text: `Explain this dish: ${dishName} in ${targetLang}. The original language is ${originalLang}. Be concise.` }]
        },
        config: {
          systemInstruction: "You are a food expert. Provide helpful dish explanations."
        }
    });
    return result.text || "No explanation available.";
  } catch (err) {
    console.error(err);
    return "Unable to get explanation right now.";
  }
};
