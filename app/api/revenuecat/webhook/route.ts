import { syncRevenueCatSubscription } from '@/lib/appSubscription';
import {
  CREATOR_COMMISSION_HOLD_DAYS,
  isAnnualSubscriptionProduct,
  revenueCatPlatform,
} from '@/lib/creatorAffiliate';
import { getSupabaseService } from '@/lib/supabase';
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

function getCanonicalAppUserId(event: Record<string, any>): string | null {
  return typeof event.app_user_id === 'string' && UUID_PATTERN.test(event.app_user_id)
    ? event.app_user_id
    : null;
}

function eventDate(value: unknown): Date {
  const milliseconds = typeof value === 'number' ? value : Number.NaN;
  return Number.isFinite(milliseconds) ? new Date(milliseconds) : new Date();
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function processCreatorCommission(event: Record<string, any>, appUserId: string): Promise<void> {
  const eventId = typeof event.id === 'string' ? event.id : '';
  if (!eventId) return;

  const supabase = getSupabaseService();
  const eventType = typeof event.type === 'string' ? event.type : 'UNKNOWN';
  const transactionId = typeof event.transaction_id === 'string' ? event.transaction_id : null;
  const environment = event.environment === 'SANDBOX' ? 'SANDBOX' : 'PRODUCTION';

  const { data: prior, error: priorError } = await supabase
    .from('revenuecat_webhook_events')
    .select('processing_status')
    .eq('event_id', eventId)
    .maybeSingle();
  if (priorError) throw new Error(`Unable to inspect webhook event: ${priorError.message}`);
  if (prior && ['processed', 'ignored'].includes(prior.processing_status)) return;

  const { error: reserveError } = await supabase.from('revenuecat_webhook_events').upsert({
    event_id: eventId,
    event_type: eventType,
    transaction_id: transactionId,
    environment,
    received_at: new Date().toISOString(),
    processing_status: 'received',
    failure_reason: null,
  }, { onConflict: 'event_id' });
  if (reserveError) throw new Error(`Unable to reserve webhook event: ${reserveError.message}`);

  try {
    const productId = typeof event.product_id === 'string' ? event.product_id : '';
    const platform = revenueCatPlatform(event.store);
    const originalTransactionId = typeof event.original_transaction_id === 'string'
      ? event.original_transaction_id
      : transactionId;

    const refundLike = eventType === 'REFUND'
      || (eventType === 'CANCELLATION' && ['CUSTOMER_SUPPORT', 'REFUNDED'].includes(event.cancel_reason));
    if (refundLike && (transactionId || originalTransactionId)) {
      const filter = [
        transactionId ? `transaction_id.eq.${transactionId}` : '',
        originalTransactionId ? `original_transaction_id.eq.${originalTransactionId}` : '',
      ].filter(Boolean).join(',');
      if (filter) {
        const { error } = await supabase
          .from('creator_commissions')
          .update({
            status: 'reversed',
            reversed_at: new Date().toISOString(),
            reversal_reason: event.cancel_reason || eventType,
          })
          .or(filter)
          .neq('status', 'reversed');
        if (error) throw new Error(`Unable to reverse creator commission: ${error.message}`);
      }
    } else if (
      eventType === 'INITIAL_PURCHASE'
      && platform
      && transactionId
      && isAnnualSubscriptionProduct(productId)
    ) {
      const { data: attribution, error: attributionError } = await supabase
        .from('creator_attributions')
        .select('id, creator_id, status, expires_at, creators(commission_rate)')
        .eq('revenuecat_app_user_id', appUserId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (attributionError) throw new Error(`Unable to load creator attribution: ${attributionError.message}`);

      if (attribution) {
        const purchasedAt = eventDate(event.purchased_at_ms);
        const holdUntil = new Date(purchasedAt.getTime() + CREATOR_COMMISSION_HOLD_DAYS * 86400000);
        const price = finiteNumber(event.price_in_purchased_currency) ?? finiteNumber(event.price);
        const tax = finiteNumber(event.tax_percentage);
        const storeCommission = finiteNumber(event.commission_percentage);
        const estimatedNet = price !== null && tax !== null && storeCommission !== null
          ? Math.max(0, price * (1 - tax) * (1 - storeCommission))
          : null;
        const commissionRate = finiteNumber((attribution.creators as any)?.commission_rate) ?? 0.2;
        const estimatedCommission = estimatedNet === null ? null : estimatedNet * commissionRate;

        const { error: commissionError } = await supabase.from('creator_commissions').insert({
          creator_id: attribution.creator_id,
          attribution_id: attribution.id,
          revenuecat_event_id: eventId,
          revenuecat_app_user_id: appUserId,
          transaction_id: transactionId,
          original_transaction_id: originalTransactionId,
          environment,
          platform,
          product_id: productId,
          currency: event.currency || event.currency_code || 'TWD',
          customer_price: price,
          estimated_net_revenue: estimatedNet,
          estimated_commission: estimatedCommission,
          commission_rate: commissionRate,
          status: 'pending',
          purchased_at: purchasedAt.toISOString(),
          hold_until: holdUntil.toISOString(),
        });
        if (commissionError && commissionError.code !== '23505') {
          throw new Error(`Unable to create creator commission: ${commissionError.message}`);
        }

        const { error: lockError } = await supabase
          .from('creator_attributions')
          .update({
            status: 'converted',
            converted_at: purchasedAt.toISOString(),
            original_transaction_id: originalTransactionId,
          })
          .eq('id', attribution.id)
          .eq('status', 'pending');
        if (lockError) throw new Error(`Unable to lock creator attribution: ${lockError.message}`);
      }
    }

    await supabase.from('revenuecat_webhook_events').update({
      processing_status: 'processed',
      processed_at: new Date().toISOString(),
    }).eq('event_id', eventId);
  } catch (error: any) {
    await supabase.from('revenuecat_webhook_events').update({
      processing_status: 'failed',
      failure_reason: String(error?.message || error).slice(0, 500),
    }).eq('event_id', eventId);
    throw error;
  }
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

    // Never promote either side of a cross-account store receipt transfer.
    if (event.type === 'TRANSFER') {
      console.warn('[revenuecat/webhook] Ignored cross-account transfer event');
      return NextResponse.json({ success: true, synced: 0 });
    }

    const appUserId = getCanonicalAppUserId(event);

    if (!appUserId) {
      return NextResponse.json({ success: true, synced: 0 });
    }

    try {
      await syncRevenueCatSubscription(appUserId);
      await processCreatorCommission(event, appUserId);
    } catch (error) {
      console.error('[revenuecat/webhook] Sync failed', error);
      return NextResponse.json({ error: 'Subscription sync failed' }, { status: 502 });
    }

    return NextResponse.json({ success: true, synced: 1 });
  } catch (error: any) {
    console.error('[revenuecat/webhook]', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}
