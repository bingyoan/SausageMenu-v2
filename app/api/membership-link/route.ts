import { createHmac, randomInt, randomUUID } from 'crypto';
import { getRequestSession } from '@/lib/authSession';
import { getLinkedMembershipStatus, maskEmail } from '@/lib/membershipLinks';
import { getSupabaseService } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
  action: z.literal('request'),
  purchaseEmail: z.string().trim().toLowerCase().email().max(254),
});

const VerifySchema = z.object({
  action: z.literal('verify'),
  requestId: z.string().uuid(),
  code: z.string().trim().regex(/^\d{6}$/),
});

function getVerificationSecret(): string {
  const secret = (
    process.env.MEMBERSHIP_LINK_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SUBSCRIPTION_USER_ID_SECRET ||
    ''
  ).trim();
  if (secret.length < 32) throw new Error('Membership verification is not configured');
  return secret;
}

function hashCode(requestId: string, code: string): string {
  return createHmac('sha256', getVerificationSecret())
    .update(`${requestId}:${code}`)
    .digest('hex');
}

function verificationEmailHtml(code: string): string {
  return `<!doctype html>
<html lang="zh-Hant">
  <body style="margin:0;background:#fff7ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#292524">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px">
      <div style="background:#ffffff;border:1px solid #fed7aa;border-radius:20px;padding:30px;text-align:center">
        <div style="font-size:38px">👑</div>
        <h1 style="font-size:22px;margin:12px 0 8px">驗證 SausageMenu 網頁版會員</h1>
        <p style="font-size:14px;line-height:1.7;color:#78716c;margin:0 0 20px">
          請在 App 的會員綁定畫面輸入以下驗證碼。<br>
          Enter this code in SausageMenu to link your web membership.
        </p>
        <div style="background:#fff7ed;border:1px solid #fb923c;border-radius:14px;padding:18px;font-size:32px;font-weight:800;letter-spacing:8px;color:#ea580c">${code}</div>
        <p style="font-size:12px;line-height:1.6;color:#a8a29e;margin:18px 0 0">
          驗證碼於 10 分鐘後失效。若非本人操作，請忽略此信。<br>
          This code expires in 10 minutes. Ignore this email if you did not request it.
        </p>
      </div>
    </div>
  </body>
</html>`;
}

async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('Email service is not configured');

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.MEMBERSHIP_EMAIL_FROM?.trim() || 'SausageMenu <onboarding@resend.dev>',
    to,
    subject: `${code}｜SausageMenu 會員驗證碼`,
    html: verificationEmailHtml(code),
    text: `SausageMenu 會員驗證碼：${code}\n\n此驗證碼將於 10 分鐘後失效。\nThis code expires in 10 minutes.`,
  });
  if (error) throw new Error(error.message || 'Unable to send verification email');
}

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  try {
    const link = await getLinkedMembershipStatus(session.email);
    return NextResponse.json({
      success: true,
      linked: Boolean(link),
      purchaseEmail: link ? maskEmail(link.purchaseEmail) : null,
      verifiedAt: link?.verifiedAt || null,
    });
  } catch (error: any) {
    console.error('[membership-link:get]', error);
    return NextResponse.json({ error: 'Unable to load membership link.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const supabase = getSupabaseService();

    if (action === 'request') {
      const parsed = RequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }
      if (parsed.data.purchaseEmail === session.email) {
        return NextResponse.json({ error: 'This is already your current App login email.' }, { status: 400 });
      }

      const existingLink = await getLinkedMembershipStatus(session.email);
      if (existingLink) {
        return NextResponse.json({
          success: true,
          linked: true,
          purchaseEmail: maskEmail(existingLink.purchaseEmail),
        });
      }

      const requestId = randomUUID();
      const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { data, error } = await supabase.rpc('create_membership_email_link_request', {
        p_request_id: requestId,
        p_app_email: session.email,
        p_purchase_email: parsed.data.purchaseEmail,
        p_code_hash: hashCode(requestId, code),
        p_expires_at: expiresAt,
      });
      if (error) throw new Error(`Unable to create verification request: ${error.message}`);
      if (!data?.accepted) {
        const status = data?.reason === 'rate_limited' ? 429 : 400;
        const message = data?.reason === 'rate_limited'
          ? 'Too many requests. Please try again later.'
          : 'Unable to create verification request.';
        return NextResponse.json({ error: message }, { status });
      }

      if (data.sendEmail === true) {
        try {
          await sendVerificationEmail(parsed.data.purchaseEmail, code);
        } catch (emailError) {
          await supabase
            .from('membership_email_link_requests')
            .update({ status: 'failed' })
            .eq('id', requestId);
          console.error('[membership-link:email]', emailError);
          return NextResponse.json({ error: 'Verification email could not be sent. Please try again later.' }, { status: 503 });
        }
      }

      // The email is sent before membership lookup. The purchase check happens
      // only after the recipient proves ownership with the one-time code.
      return NextResponse.json({
        success: true,
        linked: false,
        requestId,
        expiresAt,
        message: 'If this email has an active web membership, a verification code has been sent.',
      });
    }

    if (action === 'verify') {
      const parsed = VerifySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Enter the 6-digit verification code.' }, { status: 400 });
      }

      const { data, error } = await supabase.rpc('complete_membership_email_link', {
        p_request_id: parsed.data.requestId,
        p_app_email: session.email,
        p_code_hash: hashCode(parsed.data.requestId, parsed.data.code),
      });
      if (error) throw new Error(`Unable to verify membership: ${error.message}`);
      if (!data?.success) {
        const messages: Record<string, string> = {
          invalid_request: 'This verification request is invalid.',
          invalid_code: 'The verification code is incorrect.',
          expired: 'This verification code has expired. Request a new code.',
          failed: 'Too many incorrect attempts. Request a new code.',
          membership_not_active: 'No active web membership was found for this email.',
          app_already_linked: 'This App account is already linked to another purchase email.',
          purchase_already_linked: 'This purchase email is already linked to another App account.',
        };
        return NextResponse.json({
          error: messages[data?.reason] || 'Unable to verify membership.',
          remainingAttempts: data?.remainingAttempts,
        }, { status: 400 });
      }

      const link = await getLinkedMembershipStatus(session.email);
      return NextResponse.json({
        success: true,
        linked: true,
        purchaseEmail: link ? maskEmail(link.purchaseEmail) : null,
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    console.error('[membership-link]', error);
    return NextResponse.json({ error: error.message || 'Unable to link membership.' }, { status: 500 });
  }
}
