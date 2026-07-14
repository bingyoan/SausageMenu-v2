import { GoogleGenAI } from "@google/genai";
import { getSupabaseService } from '@/lib/supabase';
import { getRevenueCatAppUserId } from '@/lib/subscriptionUser';
import { verifySessionToken } from '@/lib/authSession';
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

const GEMINI_MODEL = 'gemini-2.5-flash';
const FREE_DAILY_LIMIT = 2;
const PAID_DAILY_LIMIT = Math.max(2, Number(process.env.GEMINI_PAID_DAILY_LIMIT || 50));

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
        const contentLength = Number(req.headers.get('content-length') || 0);
        if (contentLength > 12 * 1024 * 1024) {
            return NextResponse.json({ error: 'Menu upload is too large.' }, { status: 413 });
        }

        // The Gemini key is server-only. Never accept or expose a client-provided key.
        const serverApiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
        if (!serverApiKey) {
            console.error('[API Proxy] GEMINI_API_KEY is not configured.');
            return NextResponse.json({
                error: 'AI service is not configured yet. Please contact support.'
            }, { status: 503 });
        }

        const email = (req.headers.get('x-user-email') || '').trim().toLowerCase();
        const appUserId = (req.headers.get('x-revenuecat-app-user-id') || '').trim();
        const sessionToken = (req.headers.get('x-session-token') || '').trim();
        const usageKind = req.headers.get('x-usage-kind') === 'dish-explanation'
            ? 'dish-explanation'
            : 'menu-scan';
        const session = sessionToken ? await verifySessionToken(sessionToken) : null;
        if (!session || session.email !== email || !appUserId || getRevenueCatAppUserId(email) !== appUserId) {
            return NextResponse.json({ error: 'Please sign in again before using AI translation.' }, { status: 401 });
        }

        // 2. 🛡️ Rate Limiting
        const clientIp = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
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
        const { contents, config } = parseResult.data;

        const supabase = getSupabaseService();
        const today = new Date().toISOString().split('T')[0];
        let { data: user, error: userLookupError } = await supabase
            .from('users')
            .select('email, is_pro, pro_expires_at, subscription_status, daily_usage_count, last_usage_date')
            .ilike('email', email)
            .maybeSingle();

        if (userLookupError) {
            console.error('[API Proxy] Account lookup failed:', userLookupError);
            return NextResponse.json({ error: 'Account lookup failed. Please try again.' }, { status: 500 });
        }

        // A valid signed session is sufficient proof to repair accounts that were
        // missed by an older login build or removed during a database migration.
        if (!user) {
            const { data: repairedUser, error: repairError } = await supabase
                .from('users')
                .upsert({
                    email,
                    is_pro: false,
                    subscription_status: 'free',
                    daily_usage_count: 0,
                    last_usage_date: today,
                    created_at: new Date().toISOString(),
                    last_login_at: new Date().toISOString(),
                }, { onConflict: 'email', ignoreDuplicates: true })
                .select('email, is_pro, pro_expires_at, subscription_status, daily_usage_count, last_usage_date')
                .single();

            if (repairError || !repairedUser) {
                console.error('[API Proxy] Account repair failed:', repairError);
                return NextResponse.json({ error: 'Account synchronization failed. Please sign in again.' }, { status: 500 });
            }
            user = repairedUser;
        }

        const accountEmail = user.email;

        const hasLegacyPro = user.is_pro && (!user.pro_expires_at || new Date(user.pro_expires_at) > new Date());
        const hasSubscription = user.subscription_status === 'active';
        const isPaid = hasLegacyPro || hasSubscription;
        const currentUsage = user.last_usage_date === today ? (user.daily_usage_count || 0) : 0;
        const dailyLimit = isPaid ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT;
        if (usageKind === 'menu-scan' && currentUsage >= dailyLimit) {
            const error = isPaid
                ? 'Daily fair-use scan limit reached. Please try again tomorrow.'
                : 'Daily free scans used. Please subscribe to continue.';
            return NextResponse.json({ error }, { status: 402 });
        }

        if (usageKind === 'menu-scan') {
            await supabase
                .from('users')
                .update({ daily_usage_count: currentUsage + 1, last_usage_date: today })
                .eq('email', accountEmail);
        }

        // 4. EXECUTE GEMINI REQUEST
        console.log(`[API Proxy] Calling managed ${GEMINI_MODEL} service...`);
        const ai = new GoogleGenAI({ apiKey: serverApiKey });

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: contents,
            config: config // 這裡傳進去的是我們修改過、加強過的 config
        });

        console.log(`[API Proxy] SDK Success`);
        return NextResponse.json({
            text: response.text,
            usageMetadata: response.usageMetadata,
            remainingScans: Math.max(0, dailyLimit - currentUsage - (usageKind === 'menu-scan' ? 1 : 0)),
        });

    } catch (err: any) {
        console.error("[API Proxy] Error:", err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
