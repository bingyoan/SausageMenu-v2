import { ImageOverlayResult, ImageTranslationRegion, MenuItem, MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';
import { Schema, Type } from "@google/genai"; // Import types only
import { Capacitor } from '@capacitor/core';

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

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response: Response;
    try {
      response = await resilientFetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

const overlaySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    detectedLanguage: {
      type: Type.STRING,
      description: 'Primary source language visible in the image.'
    },
    regions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalText: {
            type: Type.STRING,
            description: 'Exact source text visible inside this region. Preserve all printed numbers and symbols.'
          },
          translatedText: {
            type: Type.STRING,
            description: 'Natural contextual translation. Printed numbers and prices must remain exactly unchanged.'
          },
          polygon: {
            type: Type.ARRAY,
            description: 'Exactly four clockwise corner points normalized to 0..1, starting at top-left.',
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER }
              },
              required: ['x', 'y']
            }
          },
          orientation: {
            type: Type.STRING,
            enum: ['horizontal', 'vertical']
          },
          rotation: {
            type: Type.NUMBER,
            description: 'Clockwise text rotation in degrees from -180 to 180.'
          },
          confidence: {
            type: Type.NUMBER,
            description: 'Recognition confidence from 0 to 1.'
          },
          kind: {
            type: Type.STRING,
            enum: ['dish', 'description', 'category', 'other']
          }
        },
        required: ['originalText', 'translatedText', 'polygon', 'orientation', 'rotation', 'confidence', 'kind']
      }
    }
  },
  required: ['detectedLanguage', 'regions']
};

const clampNormalized = (value: unknown): number => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.min(1, Math.max(0, numberValue));
};

const toRawPoint = (point: any): { x: number; y: number } | null => {
  const x = Array.isArray(point)
    ? point[0]
    : point?.x ?? point?.left ?? point?.x1;
  const y = Array.isArray(point)
    ? point[1]
    : point?.y ?? point?.top ?? point?.y1;
  const numericX = Number(x);
  const numericY = Number(y);
  if (!Number.isFinite(numericX) || !Number.isFinite(numericY)) return null;
  return { x: numericX, y: numericY };
};

const normalizeOverlayPolygon = (region: any): ImageTranslationRegion['polygon'] | null => {
  let rawPoints: any[] = Array.isArray(region?.polygon) ? region.polygon : [];

  // Some model responses use a flat [x1,y1,x2,y2,...] array.
  if (rawPoints.length === 8 && rawPoints.every(point => Number.isFinite(Number(point)))) {
    rawPoints = Array.from({ length: 4 }, (_, index) => [rawPoints[index * 2], rawPoints[index * 2 + 1]]);
  }

  // Also accept a bounding box when the model chooses that equivalent form.
  if (rawPoints.length !== 4) {
    const box = region?.bbox || region?.boundingBox || region?.box;
    if (Array.isArray(box) && box.length === 4 && box.every(point => Number.isFinite(Number(point)))) {
      const [x, y, width, height] = box.map(Number);
      rawPoints = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
    } else if (box && typeof box === 'object') {
      const x = Number(box.x ?? box.left);
      const y = Number(box.y ?? box.top);
      const right = Number(box.right);
      const bottom = Number(box.bottom);
      const width = Number(box.width);
      const height = Number(box.height);
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(width) && Number.isFinite(height)) {
        rawPoints = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
      } else if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(right) && Number.isFinite(bottom)) {
        rawPoints = [[x, y], [right, y], [right, bottom], [x, bottom]];
      }
    }
  }

  if (rawPoints.length !== 4) return null;
  const points = rawPoints.map(toRawPoint);
  if (points.some(point => !point)) return null;
  const finitePoints = points as Array<{ x: number; y: number }>;
  const maxCoordinate = Math.max(...finitePoints.flatMap(point => [Math.abs(point.x), Math.abs(point.y)]));
  // A few OCR responses use percentages instead of normalized fractions.
  const scale = maxCoordinate > 1.5 && maxCoordinate <= 100 ? 100 : 1;
  const polygon = finitePoints.map(point => ({
    x: clampNormalized(point.x / scale),
    y: clampNormalized(point.y / scale),
  })) as ImageTranslationRegion['polygon'];
  const xs = polygon.map(point => point.x);
  const ys = polygon.map(point => point.y);
  if (Math.max(...xs) - Math.min(...xs) < 0.0005 || Math.max(...ys) - Math.min(...ys) < 0.0005) return null;
  return polygon;
};

const normalizeOverlayRegions = (regions: any[]): ImageTranslationRegion[] => {
  const numericTokens = (value: string) => (
    value.match(/[$€£¥₩₹฿₫₱₽₺₴₦₡₲₵₸₾₿]?\s*\d+(?:[.,]\d+)*(?:\s*[%％])?/g) || []
  ).map(token => token.replace(/\s+/g, ''));

  return regions.slice(0, 60).flatMap((region, index) => {
    const polygon = normalizeOverlayPolygon(region);
    if (!polygon) return [];
    const originalText = String(region?.originalText || '').trim();
    const translatedText = String(region?.translatedText || '').trim();
    if (!originalText || !translatedText) return [];
    const xs = polygon.map(point => point.x);
    const ys = polygon.map(point => point.y);
    if (Math.max(...xs) - Math.min(...xs) < 0.0005 || Math.max(...ys) - Math.min(...ys) < 0.0005) return [];
    const textWithoutStandalonePrice = originalText.replace(/[$€£¥₩₹฿₫₱₽₺₴₦₡₲₵₸₾₿\d\s.,/%％+-]/g, '');
    if (!textWithoutStandalonePrice) return [];

    // Never paint a translated value over a price/quantity if the model changed
    // its numeric tokens. Keeping the original text is safer than failing the
    // complete image or showing a misleading price.
    const translatedNumericTokens = numericTokens(translatedText);
    const originalNumericTokens = numericTokens(originalText);
    const safeTranslatedText = JSON.stringify(originalNumericTokens) === JSON.stringify(translatedNumericTokens)
      ? translatedText
      : originalText;

    const kind = ['dish', 'description', 'category', 'other'].includes(region?.kind)
      ? region.kind
      : 'other';

    return [{
      id: `overlay-${Date.now()}-${index}`,
      originalText,
      translatedText: safeTranslatedText,
      polygon,
      orientation: region?.orientation === 'vertical' ? 'vertical' : 'horizontal',
      rotation: Math.min(180, Math.max(-180, Number(region?.rotation) || 0)),
      confidence: Math.min(1, Math.max(0, Number(region?.confidence) || 0)),
      kind,
    } as ImageTranslationRegion];
  });
};

export const parseImageOverlay = async (
  base64Image: string,
  targetLanguage: TargetLanguage,
  usageBatchId?: string
): Promise<ImageOverlayResult> => {
  const prompt = `
Analyze this menu image for an original-image comparison translation interface.

Return every meaningful menu text block that should be translated into ${targetLanguage}. Locate each block precisely on the source image.

STRICT RULES:
1. originalText must reproduce the exact visible source text, including accents, original script, punctuation, prices, and numbers.
2. translatedText must be a natural contextual ${targetLanguage} translation suitable for ordering food.
3. Never change, convert, estimate, remove, or invent any number, price, currency symbol, quantity, or percentage. Keep every such token exactly as printed.
4. Do not return isolated price-only or number-only regions; prices must stay visible from the untouched source image.
5. Combine words that form one visual label or menu item. Do not split a single dish name into separate character regions.
6. polygon must contain exactly four clockwise points normalized from 0 to 1, beginning at the visual top-left corner.
7. Include horizontal and vertical writing. Set orientation and rotation so the translated overlay follows the source layout.
8. Use the surrounding cuisine and menu context to disambiguate dish names. Do not hallucinate text hidden or absent from the image.
9. If confidence is low, still return the best exact reading and set confidence below 0.65.
10. Return at most 60 meaningful regions. Skip decorative text, logos, and tiny unreadable fragments.
11. Output pure JSON matching the schema.
  `;

  const result = await requestManagedGemini({
      requestId: createRequestId(),
      usageBatchId,
      usageKind: 'menu',
      responseMode: 'overlay',
      pageCount: 1,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: overlaySchema,
        systemInstruction: `You are a precise multilingual menu OCR and layout engine. Preserve source text and all printed numbers exactly, translate only into ${targetLanguage}, and return accurate normalized four-point polygons.`
      }
    }, {
      // Overlay OCR is intentionally a single bounded request. The old
      // 90-second request plus nested retries could make one image appear to
      // hang for two minutes before failing.
      timeoutMs: 45000,
      fetchRetries: 0,
      maxAttempts: 1,
    });

  if (!result?.text) throw new Error('AI 沒有回傳圖片辨識結果，請重試。');
  let parsed: any;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    const fenced = result.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
    const start = result.text.indexOf('{');
    const end = result.text.lastIndexOf('}');
    const candidate = fenced || (start >= 0 && end > start ? result.text.slice(start, end + 1) : '');
    if (!candidate) throw new Error('AI 回傳格式無法解析，請重試。');
    parsed = JSON.parse(candidate);
  }
  const regions = normalizeOverlayRegions(Array.isArray(parsed?.regions) ? parsed.regions : []);
  if (regions.length === 0) throw new Error('圖片中找不到可翻譯的菜單文字，請換一張較清楚的照片。');

  return {
    detectedLanguage: String(parsed?.detectedLanguage || 'Unknown'),
    regions,
    usageMetadata: result.usageMetadata,
  };
};

export const parseMenuImage = async (
  base64Images: string[],
  targetLanguage: TargetLanguage
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
    });
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
  onPageStart?: (pageIndex: number, totalPages: number) => void
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
      });
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
