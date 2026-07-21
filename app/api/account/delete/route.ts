import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getRequestSession } from '../../../../lib/authSession';
import { getSupabaseService } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

type SupabaseError = { message?: string } | null;

function databaseFailure(scope: string, error: SupabaseError) {
  console.error(`[account-delete] ${scope}:`, error);
  return NextResponse.json(
    { success: false, error: 'Account deletion could not be completed. Please try again.' },
    { status: 500 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = getRequestSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Your session has expired. Please sign in again.' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    if (body.confirmation !== 'DELETE') {
      return NextResponse.json(
        { success: false, error: 'Type DELETE to confirm permanent account deletion.' },
        { status: 400 },
      );
    }

    const email = session.email.trim().toLowerCase();
    const supabase = getSupabaseService();
    const { data: account, error: accountError } = await supabase
      .from('users')
      .select('revenuecat_app_user_id')
      .eq('email', email)
      .maybeSingle();

    if (accountError) return databaseFailure('unable to load account', accountError);

    const revenueCatAppUserId = account?.revenuecat_app_user_id;

    const { error: menuError } = await supabase
      .from('cached_menus')
      .delete()
      .eq('user_id', email);
    if (menuError) return databaseFailure('unable to delete cloud menus', menuError);

    const { error: usageError } = await supabase
      .from('app_ai_usage_requests')
      .delete()
      .eq('user_email', email);
    if (usageError) return databaseFailure('unable to delete usage records', usageError);

    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('email', email);
    if (userError) return databaseFailure('unable to delete user account', userError);

    // External cleanup is best-effort. Store or network errors must not block
    // deletion of the account and personal app data from our own system.
    const revenueCatSecret = process.env.REVENUECAT_SECRET_API_KEY;
    if (revenueCatAppUserId && revenueCatSecret) {
      try {
        const revenueCatResponse = await fetch(
          `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(revenueCatAppUserId)}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${revenueCatSecret}`,
              Accept: 'application/json',
            },
            cache: 'no-store',
          },
        );

        if (!revenueCatResponse.ok && revenueCatResponse.status !== 404) {
          console.warn('[account-delete] RevenueCat cleanup did not complete:', {
            status: revenueCatResponse.status,
            body: await revenueCatResponse.text(),
          });
        }
      } catch (error) {
        console.warn('[account-delete] RevenueCat cleanup request failed:', error);
      }
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error('[account-delete] unexpected failure:', error);
    return NextResponse.json(
      { success: false, error: 'Account deletion could not be completed. Please try again.' },
      { status: 500 },
    );
  }
}
