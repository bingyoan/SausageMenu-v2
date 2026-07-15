import { syncRevenueCatSubscription } from '@/lib/appSubscription';
import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyHmac(rawBody: string, signatureHeader: string, secret: string): boolean {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => part.trim().split('=', 2))
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

function collectAppUserIds(event: Record<string, any>): string[] {
  const candidates = [
    event.app_user_id,
    event.original_app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : []),
    ...(Array.isArray(event.transferred_from) ? event.transferred_from : []),
    ...(Array.isArray(event.transferred_to) ? event.transferred_to : []),
  ];
  return [...new Set(candidates.filter((value): value is string =>
    typeof value === 'string' && UUID_PATTERN.test(value)
  ))];
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signingSecret = process.env.REVENUECAT_WEBHOOK_SIGNING_SECRET?.trim();
  const authorizationSecret = process.env.REVENUECAT_WEBHOOK_AUTH?.trim();

  if (signingSecret) {
    const signature = request.headers.get('x-revenuecat-webhook-signature') || '';
    if (!verifyHmac(rawBody, signature, signingSecret)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
  } else if (authorizationSecret) {
    const authorization = request.headers.get('authorization') || '';
    if (!safeEqual(authorization, authorizationSecret)) {
      return NextResponse.json({ error: 'Invalid webhook authorization' }, { status: 401 });
    }
  } else {
    console.error('[revenuecat/webhook] No webhook verification secret configured');
    return NextResponse.json({ error: 'Webhook verification is not configured' }, { status: 503 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const event = payload.event || {};
    const appUserIds = collectAppUserIds(event);

    if (appUserIds.length === 0) {
      return NextResponse.json({ success: true, synced: 0 });
    }

    const results = await Promise.allSettled(appUserIds.map(syncRevenueCatSubscription));
    const synced = results.filter((result) => result.status === 'fulfilled').length;
    const failures = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => String(result.reason));

    if (synced === 0 && failures.length > 0) {
      console.error('[revenuecat/webhook] Sync failed', failures);
      return NextResponse.json({ error: 'Subscription sync failed' }, { status: 502 });
    }

    return NextResponse.json({ success: true, synced });
  } catch (error: any) {
    console.error('[revenuecat/webhook]', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}
