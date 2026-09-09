import { createHash, timingSafeEqual } from 'crypto';
import { getRequestSession } from '@/lib/authSession';
import { getSupabaseService } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ACTIVATION_DAYS = 10;
const RedeemSchema = z.object({
  code: z.string().trim().min(1).max(128),
});

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function hashCode(code: string): string {
  return createHash('sha256').update(normalizeCode(code), 'utf8').digest('hex');
}

function configuredCodeHash(): string | null {
  const configuredHash = process.env.PRO_ACTIVATION_CODE_HASH?.trim().toLowerCase();
  if (configuredHash && /^[0-9a-f]{64}$/.test(configuredHash)) return configuredHash;

  const configuredCode = process.env.PRO_ACTIVATION_CODE?.trim();
  return configuredCode ? hashCode(configuredCode) : null;
}

function matchesConfiguredCode(code: string, expectedHash: string | null): boolean {
  if (!expectedHash) return false;

  const supplied = Buffer.from(hashCode(code), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function errorResponse(error: string, code: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error, code }, { status });
}

export async function POST(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) return errorResponse('請先登入後再輸入啟用碼。', 'AUTH_REQUIRED', 401);

  const parsed = RedeemSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return errorResponse('請輸入啟用碼。', 'INVALID_REQUEST', 400);

  const expectedHash = configuredCodeHash();
  if (!expectedHash) {
    console.error('[redeem-activation-code] PRO_ACTIVATION_CODE is not configured');
    return errorResponse('啟用碼功能尚未設定，請聯絡管理員。', 'ACTIVATION_NOT_CONFIGURED', 503);
  }

  if (!matchesConfiguredCode(parsed.data.code, expectedHash)) {
    return errorResponse('啟用碼無效。', 'ACTIVATION_INVALID', 400);
  }

  try {
    const supabase = getSupabaseService();
    const email = session.email.toLowerCase().trim();
    const { data: user, error: loadError } = await supabase
      .from('users')
      .select('email, activation_pro_expires_at, activation_code_redeemed_at')
      .eq('email', email)
      .maybeSingle();

    if (loadError) throw loadError;
    if (!user) return errorResponse('找不到使用者帳號，請重新登入。', 'ACCOUNT_NOT_FOUND', 401);

    const now = Date.now();
    const currentExpiry = user.activation_pro_expires_at ? Date.parse(user.activation_pro_expires_at) : NaN;
    if (Number.isFinite(currentExpiry) && currentExpiry > now) {
      return NextResponse.json({
        success: true,
        alreadyActive: true,
        expiresAt: user.activation_pro_expires_at,
        days: ACTIVATION_DAYS,
      });
    }

    if (user.activation_code_redeemed_at) {
      return errorResponse('此帳號已使用過啟用碼。', 'ACTIVATION_ALREADY_USED', 409);
    }

    const expiresAt = new Date(now + ACTIVATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        activation_pro_expires_at: expiresAt,
        activation_code_redeemed_at: new Date(now).toISOString(),
      })
      .eq('email', email)
      .is('activation_code_redeemed_at', null)
      .select('activation_pro_expires_at')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedUser) return errorResponse('此帳號已使用過啟用碼。', 'ACTIVATION_ALREADY_USED', 409);

    return NextResponse.json({
      success: true,
      expiresAt: updatedUser.activation_pro_expires_at,
      days: ACTIVATION_DAYS,
    });
  } catch (error: any) {
    console.error('[redeem-activation-code]', error);
    return errorResponse('啟用碼目前無法使用，請稍後再試。', 'ACTIVATION_ERROR', 500);
  }
}
