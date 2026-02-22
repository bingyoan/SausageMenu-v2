import { MenuItem, MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';
import { Schema, Type } from "@google/genai"; // Import types only

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
          originalName: { type: Type.STRING, description: "EXACT text from image. Do not autocorrect." },
          translatedName: { type: Type.STRING },
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

export const parseMenuImage = async (
  apiKey: string,
  base64Images: string[],
  targetLanguage: TargetLanguage,
  isHandwritingMode: boolean = false,
  authToken: string // NEW: Supabase Token
): Promise<MenuData> => {
  // DEBUG: Log the target language to verify it's being passed correctly
  console.log('[parseMenuImage] Target Language:', targetLanguage);

  const targetCurrency = getTargetCurrency(targetLanguage);
  const handwritingInstructions = isHandwritingMode ? `
    *** HANDWRITING & CALLIGRAPHY MODE ACTIVATED ***
    1. The image contains ARTISTIC FONTS, BRUSH CALLIGRAPHY (Shodo), or HANDWRITTEN text.
    2. Text might be arranged VERTICALLY (Tategaki). Read columns from right to left.
    3. Contextual Inference: If a character is messy or ambiguous, infer the dish name based on common Izakaya/Street Food menu items.
    4. Be permissive: Even if the ink is blurry, try to extract the item.
  ` : "";

  const prompt = `
    *** CRITICAL: ALL OUTPUT TEXT MUST BE IN ${targetLanguage} ***
    
    Analyze these menu images (Total: ${base64Images.length} images).
    ${handwritingInstructions}
    
    ABSOLUTE REQUIREMENT: 
    - ALL item names (name field) MUST be translated to ${targetLanguage}
    - ALL descriptions (description field) MUST be in ${targetLanguage}
    - ALL category names (category field) MUST be in ${targetLanguage}
    - ALL option names MUST be in ${targetLanguage}
    - DO NOT use the original menu language in any text output
    
    CRITICAL OBJECTIVE: EXTRACT EVERY SINGLE MENU ITEM VISIBLE.
    1. STRICT OCR & ROBUSTNESS: Extract text EXACTLY as seen, then TRANSLATE to ${targetLanguage}. If price is missing, set to 0.
    2. DUAL PRICING / VARIANTS: Handle sizes/add-ons as options.
    3. OUTPUT FORMAT: Group by category. ALL TEXT MUST BE IN ${targetLanguage}. 
    4. CURRENCY & EXCHANGE:
       - Detected "originalCurrency" MUST be a 3-letter ISO 4217 code (e.g., JPY, USD, THB).
       - Detected "exchangeRate" is an estimate of: 1 unit of Menu Currency = X units of ${targetCurrency}.
    5. DIETARY & ALLERGY: Detect allergens (Beef, Pork, Peanuts, etc). Allergen names MUST be in ${targetLanguage}.
    
    FINAL REMINDER: Every single text field in your JSON response MUST be written in ${targetLanguage}. This is non-negotiable.
    Return pure JSON adhering to the schema.
  `;

  const parts: any[] = [{ text: prompt }];
  base64Images.forEach(img => {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
  });

  let retries = 0;
  const maxRetries = 3;

  const executeRequest = async (): Promise<any> => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-custom-api-key': apiKey,
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          contents: { parts: parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: menuSchema,
            systemInstruction: `You are an expert menu digitizer. Your goal is 100% recall of items. Be strict about allergen detection. CRITICAL: ALL text output (item names, descriptions, categories, options) MUST be written in ${targetLanguage}. You must translate everything into ${targetLanguage}, never output in the original menu language.`
          }
        })
      });

      console.log(`[GeminiService] Response Status: ${response.status}`);

      if (response.status === 503 && retries < maxRetries) {
        retries++;
        console.warn(`[GeminiService] 503 Error, retrying ${retries}/${maxRetries}...`);
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, retries)));
        return executeRequest();
      }

      if (!response.ok) {
        let errData;
        const errText = await response.text();
        console.error(`[GeminiService] Error Response Body: ${errText}`);
        try {
          errData = JSON.parse(errText);
        } catch {
          errData = { error: errText };
        }
        throw new Error(errData.error || `Server Failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (retries < maxRetries) {
        retries++;
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, retries)));
        return executeRequest();
      }
      throw error;
    }
  };

  try {
    const result = await executeRequest();
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

    const itemsWithIds = parsed.items.map((item: any, index: number) => ({
      ...item,
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
  apiKey: string,
  base64Images: string[],
  targetLanguage: TargetLanguage,
  isHandwritingMode: boolean = false,
  authToken: string,
  onPageComplete: (currentData: MenuData, pageIndex: number, totalPages: number) => void,
  onPageStart?: (pageIndex: number, totalPages: number) => void
): Promise<MenuData> => {
  console.log(`[parseMenuPageByPage] Starting: ${base64Images.length} pages, lang: ${targetLanguage}`);

  const targetCurrency = getTargetCurrency(targetLanguage);
  const handwritingInstructions = isHandwritingMode ? `
    *** HANDWRITING & CALLIGRAPHY MODE ACTIVATED ***
    1. The image contains ARTISTIC FONTS, BRUSH CALLIGRAPHY (Shodo), or HANDWRITTEN text.
    2. Text might be arranged VERTICALLY (Tategaki). Read columns from right to left.
    3. Contextual Inference: If a character is messy or ambiguous, infer the dish name based on common menu items.
    4. Be permissive: Even if the ink is blurry, try to extract the item.
  ` : "";

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
      *** CRITICAL: ALL OUTPUT TEXT MUST BE IN ${targetLanguage} ***
      
      Analyze this menu image (Page ${i + 1} of ${base64Images.length}).
      ${handwritingInstructions}
      
      ABSOLUTE REQUIREMENT: 
      - ALL item names (name field) MUST be translated to ${targetLanguage}
      - ALL descriptions (description field) MUST be in ${targetLanguage}
      - ALL category names (category field) MUST be in ${targetLanguage}
      - ALL option names MUST be in ${targetLanguage}
      - DO NOT use the original menu language in any text output
      
      CRITICAL OBJECTIVE: EXTRACT EVERY SINGLE MENU ITEM VISIBLE ON THIS PAGE.
      1. STRICT OCR & ROBUSTNESS: Extract text EXACTLY as seen, then TRANSLATE to ${targetLanguage}. If price is missing, set to 0.
      2. DUAL PRICING / VARIANTS: Handle sizes/add-ons as options.
      3. OUTPUT FORMAT: Group by category. ALL TEXT MUST BE IN ${targetLanguage}. 
      4. CURRENCY & EXCHANGE:
         - Detected "originalCurrency" MUST be a 3-letter ISO 4217 code (e.g., JPY, USD, THB).
         - Detected "exchangeRate" is an estimate of: 1 unit of Menu Currency = X units of ${targetCurrency}.
      5. DIETARY & ALLERGY: Detect allergens (Beef, Pork, Peanuts, etc). Allergen names MUST be in ${targetLanguage}.
      
      FINAL REMINDER: Every single text field in your JSON response MUST be written in ${targetLanguage}.
      Return pure JSON adhering to the schema.
    `;

    const parts: any[] = [
      { text: pagePrompt },
      { inlineData: { mimeType: 'image/jpeg', data: base64Images[i] } }
    ];

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-custom-api-key': apiKey,
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: menuSchema,
            systemInstruction: `You are an expert menu digitizer. Your goal is 100% recall of items. Be strict about allergen detection. CRITICAL: ALL text output MUST be in ${targetLanguage}.`
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Page ${i + 1}] Error: ${errText}`);
        // 單頁失敗不中斷，繼續下一頁
        continue;
      }

      const result = await response.json();
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
      // 單頁失敗不中斷
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
  apiKey: string,
  dishName: string,
  originalLang: string,
  targetLang: TargetLanguage
): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-custom-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [{ text: `Explain this dish: ${dishName} in ${targetLang}. The original language is ${originalLang}. Be concise.` }]
        },
        config: {
          systemInstruction: "You are a food expert. Provide helpful dish explanations."
        }
      })
    });

    if (!response.ok) throw new Error("Explanation failed");
    const result = await response.json();
    return result.text || "No explanation available.";
  } catch (err) {
    console.error(err);
    return "Unable to get explanation right now.";
  }
};
