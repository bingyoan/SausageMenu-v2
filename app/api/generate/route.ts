import { getRequestSession } from '@/lib/authSession';
import { getSupabaseService } from '@/lib/supabase';
import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const GenerateSchema = z.object({
  requestId: z.string().uuid(),
  usageKind: z.enum(['menu', 'explain']).default('menu'),
  pageCount: z.number().int().min(1).max(4),
  contents: z.object({ parts: z.array(z.any()).min(1).max(5) }),
  config: z.object({
    responseMimeType: z.string().optional(),
    responseSchema: z.any().optional(),
    systemInstruction: z.string().max(16000).optional(),
  }).optional(),
});

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_MINUTE = 12;
const MODEL = 'gemini-2.5-flash';

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(key);
  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  record.count += 1;
  return record.count <= RATE_LIMIT_PER_MINUTE;
}

function quotaMessage(reason?: string): string {
  switch (reason) {
    case 'free_lifetime_limit': return 'Your 3 free menu pages have been used. Please subscribe to continue.';
    case 'paid_daily_limit': return 'Today\'s 20-page limit has been reached. Please try again tomorrow.';
    case 'paid_monthly_limit': return 'This month\'s 60-page limit has been reached.';
    case 'single_request_limit': return 'You can translate up to 4 menu pages at a time.';
    case 'service_daily_budget': return 'The AI service has reached its daily safety limit. Please try again later.';
    case 'account_not_found': return 'Account was not found. Please sign in again.';
    default: return 'This translation cannot be started right now.';
  }
}

function estimateCostUsd(usage: any): number {
  const prompt = Number(usage?.promptTokenCount || 0);
  const output = Number(usage?.candidatesTokenCount || 0) + Number(usage?.thoughtsTokenCount || 0);
  return Number(((prompt * 0.30 + output * 2.50) / 1_000_000).toFixed(6));
}

export async function POST(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Please sign in again.', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  const clientIp = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown')
    .split(',')[0]
    .trim();
  if (!checkRateLimit(`${session.email}:${clientIp}`)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.', code: 'RATE_LIMIT' },
      { status: 429 }
    );
  }

  const parsed = GenerateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid generation request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { requestId, usageKind, pageCount, contents } = parsed.data;
  const imageCount = contents.parts.filter((part: any) =>
    typeof part?.inlineData?.data === 'string' && part.inlineData.data.length > 0
  ).length;
  if (usageKind === 'menu' && (imageCount < 1 || imageCount !== pageCount)) {
    return NextResponse.json({ error: 'Menu page count does not match the uploaded images.' }, { status: 400 });
  }
  if (usageKind === 'explain' && imageCount !== 0) {
    return NextResponse.json({ error: 'Invalid explanation request.' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service is not configured' }, { status: 503 });
  }

  const supabase = getSupabaseService();
  const { data: cached } = await supabase
    .from('app_ai_usage_requests')
    .select('response_json')
    .eq('request_id', requestId)
    .eq('user_email', session.email)
    .eq('status', 'completed')
    .maybeSingle();
  if (cached?.response_json) return NextResponse.json(cached.response_json);

  const globalDailyLimit = Math.max(100, Number(process.env.GEMINI_GLOBAL_DAILY_PAGE_LIMIT || 5000));
  const { data: reservation, error: reserveError } = await supabase.rpc('reserve_app_ai_usage', {
    p_email: session.email,
    p_request_id: requestId,
    p_page_count: pageCount,
    p_global_daily_page_limit: globalDailyLimit,
  });
  if (reserveError) {
    console.error('[generate] Quota reservation failed', reserveError);
    return NextResponse.json(
      { error: 'Usage protection is not ready. Run the latest Supabase migration.', code: 'QUOTA_NOT_READY' },
      { status: 503 }
    );
  }
  if (!reservation?.allowed) {
    const reason = reservation?.reason || 'quota_exceeded';
    const status = reason === 'account_not_found' ? 401 : 429;
    return NextResponse.json({ error: quotaMessage(reason), code: reason, quota: reservation }, { status });
  }

  try {
    const originalInstruction = parsed.data.config?.systemInstruction || '';
    const config = {
      ...parsed.data.config,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 1024 },
      systemInstruction: `${originalInstruction}\n\nSECURITY RULES: Preserve every printed price and number exactly. Do not invent menu items, ingredients, allergens, or prices. Follow the target language requested above.`,
    };

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({ model: MODEL, contents, config });
    const responseBody = { text: response.text, usageMetadata: response.usageMetadata };
    const usage: any = response.usageMetadata || {};

    const { error: completeError } = await supabase.rpc('complete_app_ai_usage', {
      p_request_id: requestId,
      p_model: MODEL,
      p_prompt_tokens: Number(usage.promptTokenCount || 0),
      p_output_tokens: Number(usage.candidatesTokenCount || 0),
      p_thinking_tokens: Number(usage.thoughtsTokenCount || 0),
      p_total_tokens: Number(usage.totalTokenCount || 0),
      p_estimated_cost_usd: estimateCostUsd(usage),
      p_response_json: responseBody,
    });
    if (completeError) console.error('[generate] Usage completion log failed', completeError);
    return NextResponse.json(responseBody);
  } catch (error: any) {
    const { error: releaseError } = await supabase.rpc('release_app_ai_usage', { p_request_id: requestId });
    if (releaseError) console.error('[generate] Failed to release quota', releaseError);
    console.error('[generate] Gemini request failed', error);
    return NextResponse.json({ error: error.message || 'AI generation failed' }, { status: 502 });
  }
}
