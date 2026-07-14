import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Ensure this route is always server-rendered and never pre-generated
export const dynamic = 'force-dynamic';

// Zod Schema for Request Validation
const GenerateSchema = z.object({
    model: z.string().min(1, 'Model is required'),
    contents: z.object({
        parts: z.array(z.any())
    }),
    config: z.object({
        responseMimeType: z.string().optional(),
        responseSchema: z.any().optional(),
        systemInstruction: z.string().optional()
    }).optional()
});

// 🔥 定義強制翻譯的系統指令 (這是我們的新武器)
const FORCE_CHINESE_INSTRUCTION = `
CRITICAL LOCALIZATION RULES (OVERRIDE ALL OTHERS):
1. **TARGET LANGUAGE**: Traditional Chinese (Taiwan usage).
2. **TRANSLATE CATEGORIES**: You MUST translate ALL category names/section headers.
   - Input: "Miscellaneous Dishes" -> Output: "綜合/其他菜色"
   - Input: "Starters" -> Output: "開胃菜"
   - Input: "Oriental Dishes" -> Output: "東方料理"
   - NEVER leave category names in English, Japanese, or Korean.
3. **DISH NAMES**: Translate dish names to semantic Chinese.
4. **CURRENCY**: Keep numbers exactly as shown.
`;

// ⭐ 簡易 Rate Limiting（防濫用）
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 15; // 每分鐘最多 15 次
const RATE_WINDOW = 60 * 1000; // 1 分鐘

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = requestCounts.get(ip);
    if (!record || now > record.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
        return true;
    }
    record.count++;
    return record.count <= RATE_LIMIT;
}

export async function POST(req: Request) {
    console.log(`[API Proxy] Received request at ${new Date().toISOString()}`);
    try {
        // 1. 🔒 API Key 從客戶端附帶的 Header 讀取
        const apiKey = req.headers.get('x-custom-api-key');

        if (!apiKey) {
            console.error('[API Proxy] Client API Key is missing');
            return NextResponse.json({ error: 'Require API Key' }, { status: 401 });
        }

        // 2. 🛡️ Rate Limiting
        const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        if (!checkRateLimit(clientIp)) {
            return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
        }

        // 2. INPUT VALIDATION
        const rawBody = await req.json();
        console.log(`[API Proxy] Request body model: ${rawBody.model}`);

        const parseResult = GenerateSchema.safeParse(rawBody);

        if (!parseResult.success) {
            console.error(`[API Proxy] Validation Failed:`, parseResult.error.flatten());
            return NextResponse.json({
                error: 'Invalid request body',
                details: parseResult.error.flatten()
            }, { status: 400 });
        }

        // 解構出原本的參數，注意這裡我們用 let 因為我們要修改 config
        let { model, contents, config } = parseResult.data;

        // =========================================================
        // 🛠️ 3. 強制注入「絕對中文」指令 (INJECTION START)
        // =========================================================

        // 確保 config 存在
        if (!config) {
            config = {};
        }

        // 取出原本前端傳來的指令 (如果有的話)
        const originalInstruction = config.systemInstruction || "";

        // 將我們的「強制指令」接在原本指令的後面，權重更高
        // 這樣 AI 會先讀原本的，最後讀到這個「最重要的規則」
        config.systemInstruction = `${originalInstruction}\n\n${FORCE_CHINESE_INSTRUCTION}`;

        console.log(`[API Proxy] System Instruction injected with Force Chinese rules.`);

        // =========================================================
        // 🛠️ INJECTION END
        // =========================================================

        // 4. EXECUTE GEMINI REQUEST
        console.log(`[API Proxy] Calling Google GenAI SDK...`);
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: config // 這裡傳進去的是我們修改過、加強過的 config
        });

        console.log(`[API Proxy] SDK Success`);
        return NextResponse.json({
            text: response.text,
            usageMetadata: response.usageMetadata
        });

    } catch (err: any) {
        console.error("[API Proxy] Error:", err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
