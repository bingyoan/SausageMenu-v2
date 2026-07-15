import { getRequestSession } from '@/lib/authSession';
import { isActiveAppSubscription } from '@/lib/appSubscription';
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
      .select('daily_usage_count, monthly_usage_count, free_lifetime_pages_used, last_usage_date, usage_month, app_subscription_status, app_subscription_expires_at')
      .eq('email', session.email)
      .maybeSingle();
    if (error) throw error;
    if (!user) return NextResponse.json({ error: 'Account was not found. Please sign in again.' }, { status: 401 });

    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const dailyUsed = user.last_usage_date === today ? Number(user.daily_usage_count || 0) : 0;
    const monthlyUsed = user.usage_month === month ? Number(user.monthly_usage_count || 0) : 0;
    const freeUsed = Number(user.free_lifetime_pages_used || 0);
    const isPaid = isActiveAppSubscription(user);
    const pageCount = parsed.data.pageCount;

    if (isPaid) {
      const canUse = dailyUsed + pageCount <= 20 && monthlyUsed + pageCount <= 60;
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
      canUse: freeUsed + pageCount <= 3,
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
