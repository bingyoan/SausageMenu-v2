import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseService } from '@/lib/supabase';
import { getRevenueCatAppUserId } from '@/lib/subscriptionUser';
import { verifySessionToken } from '@/lib/authSession';
import { getRevenueCatProStatus } from '@/lib/revenueCatServer';

export const dynamic = 'force-dynamic';

const SyncSchema = z.object({
  email: z.string().email(),
  appUserID: z.string().min(16).max(100),
});

export async function POST(request: Request) {
  try {
    const parsed = SyncSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid subscription identity.' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const appUserID = parsed.data.appUserID.trim();
    const sessionToken = (request.headers.get('x-session-token') || '').trim();
    const session = sessionToken ? await verifySessionToken(sessionToken) : null;
    if (!session || session.email !== email || getRevenueCatAppUserId(email) !== appUserID) {
      return NextResponse.json({ error: 'Subscription identity does not match.' }, { status: 401 });
    }

    const status = await getRevenueCatProStatus(appUserID);

    const supabase = getSupabaseService();
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: status.active ? 'active' : 'expired',
      })
      .eq('email', email);
    if (error) throw error;

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('[subscription/sync] Error:', error);
    return NextResponse.json({ error: error.message || 'Subscription verification failed.' }, { status: 500 });
  }
}
