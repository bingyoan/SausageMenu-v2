import { getRequestSession } from '@/lib/authSession';
import { syncRevenueCatSubscription } from '@/lib/appSubscription';
import { getSupabaseService } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CheckSchema = z.object({ pageCount: z.number().int().min(1).max(4).default(1) });

export async function POST(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  try {
    const parsed = CheckSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid page count' }, { status: 400 });

    const supabase = getSupabaseService();
    const { data: user, error } = await supabase
      .from('users')
      .select('daily_usage_count, monthly_usage_count, free_lifetime_pages_used, last_usage_date, usage_month, app_subscription_status, app_subscription_expires_at, revenuecat_app_user_id')
      .eq('email', session.email)
      .maybeSingle();
    if (error) throw error;
    if (!user) return NextResponse.json({ error: 'Account was not found. Please sign in again.' }, { status: 401 });

    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const dailyUsed = user.last_usage_date === today ? Number(user.daily_usage_count || 0) : 0;
    const monthlyUsed = user.usage_month === month ? Number(user.monthly_usage_count || 0) : 0;
    const freeUsed = Number(user.free_lifetime_pages_used || 0);
    let isPaid = false;
    if (user.revenuecat_app_user_id && process.env.REVENUECAT_SECRET_API_KEY) {
      try {
        const snapshot = await syncRevenueCatSubscription(user.revenuecat_app_user_id);
        isPaid = snapshot.isActive;
      } catch (error) {
        // Never grant managed AI usage from a stale cached subscription when
        // RevenueCat cannot confirm that this app account owns the purchase.
        console.warn('[check-usage] RevenueCat refresh failed; denying cached subscription access', error);
        isPaid = false;
      }
    } else {
      console.error('[check-usage] Subscription verification is not configured for this account');
    }
    if (isPaid) {
      const canUse = dailyUsed + 1 <= 20 && monthlyUsed + 1 <= 60;
      return NextResponse.json({
        success: true,
        canUse,
        isPro: true,
        dailyUsed,
        dailyLimit: 20,
        dailyRemaining: Math.max(0, 20 - dailyUsed),
        monthlyUsed,
        monthlyLimit: 60,
        monthlyRemaining: Math.max(0, 60 - monthlyUsed),
      });
    }

    return NextResponse.json({
      success: true,
      canUse: freeUsed + 1 <= 3,
      isPro: false,
      lifetimeUsed: freeUsed,
      lifetimeLimit: 3,
      lifetimeRemaining: Math.max(0, 3 - freeUsed),
    });
  } catch (error: any) {
    console.error('[check-usage]', error);
    return NextResponse.json({ error: error.message || 'Unable to check usage' }, { status: 500 });
  }
}
