import { getRequestSession } from '@/lib/authSession';
import { syncRevenueCatSubscription } from '@/lib/appSubscription';
import { getSupabaseService } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SyncSchema = z.object({
  appUserId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const session = getRequestSession(request);
    if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

    const parsed = SyncSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid RevenueCat App User ID' }, { status: 400 });
    }

    const supabase = getSupabaseService();
    const { data: account } = await supabase
      .from('users')
      .select('email')
      .eq('email', session.email)
      .eq('revenuecat_app_user_id', parsed.data.appUserId)
      .maybeSingle();
    if (!account) return NextResponse.json({ error: 'RevenueCat account mismatch' }, { status: 403 });

    const subscription = await syncRevenueCatSubscription(parsed.data.appUserId);
    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    console.error('[revenuecat/sync]', error);
    return NextResponse.json({ error: error.message || 'Subscription sync failed' }, { status: 502 });
  }
}
