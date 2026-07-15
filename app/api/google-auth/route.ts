import { clearSessionCookie, getRequestSession, setSessionCookie } from '@/lib/authSession';
import { isActiveAppSubscription, syncRevenueCatSubscription } from '@/lib/appSubscription';
import { verifyAppleCredential, verifyGoogleCredential } from '@/lib/identityVerification';
import { getSupabaseService } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function loadUser(email: string) {
  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw new Error(`Unable to load account: ${error.message}`);
  return data;
}

async function toResponseUser(user: any) {
  let isSubscribed = isActiveAppSubscription(user);
  let subscriptionStatus = user.app_subscription_status || 'free';
  let subscriptionExpiresAt = user.app_subscription_expires_at || null;

  if (user.revenuecat_app_user_id && process.env.REVENUECAT_SECRET_API_KEY) {
    try {
      const snapshot = await syncRevenueCatSubscription(user.revenuecat_app_user_id);
      isSubscribed = snapshot.isActive;
      subscriptionStatus = snapshot.status;
      subscriptionExpiresAt = snapshot.expiresAt;
    } catch (error) {
      console.warn('[google-auth] RevenueCat refresh failed; using cached status', error);
    }
  }

  return {
    email: user.email,
    displayName: user.display_name || user.email.split('@')[0],
    photoUrl: user.photo_url || undefined,
    isPro: isSubscribed,
    revenueCatAppUserId: user.revenuecat_app_user_id,
    subscriptionStatus,
    subscriptionExpiresAt,
    dailyUsageCount: user.daily_usage_count || 0,
    monthlyUsageCount: user.monthly_usage_count || 0,
    freeLifetimePagesUsed: user.free_lifetime_pages_used || 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body.action === 'logout') {
      const response = NextResponse.json({ success: true });
      clearSessionCookie(response);
      return response;
    }

    if (body.action === 'session') {
      const session = getRequestSession(request);
      if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      const user = await loadUser(session.email);
      if (!user) return NextResponse.json({ error: 'Account was not found' }, { status: 404 });
      return NextResponse.json({ success: true, isNewUser: false, user: await toResponseUser(user) });
    }

    const provider = body.provider === 'apple' ? 'apple' : 'google';
    const identity = provider === 'apple'
      ? await verifyAppleCredential(body.identityToken || '')
      : await verifyGoogleCredential({ idToken: body.idToken, accessToken: body.accessToken });

    const normalizedEmail = identity.email.toLowerCase().trim();
    const displayName = body.displayName || identity.displayName || normalizedEmail.split('@')[0];
    const photoUrl = body.photoUrl || identity.photoUrl || null;
    const supabase = getSupabaseService();
    let user = await loadUser(normalizedEmail);
    const isNewUser = !user;

    if (user) {
      const revenueCatAppUserId = user.revenuecat_app_user_id || randomUUID();
      const { error } = await supabase
        .from('users')
        .update({
          google_id: identity.providerId,
          display_name: displayName,
          photo_url: photoUrl || user.photo_url,
          revenuecat_app_user_id: revenueCatAppUserId,
          last_login_at: new Date().toISOString(),
        })
        .eq('email', normalizedEmail);
      if (error) throw new Error(`Unable to update account: ${error.message}`);
    } else {
      const { error } = await supabase.from('users').insert({
        email: normalizedEmail,
        google_id: identity.providerId,
        display_name: displayName,
        photo_url: photoUrl,
        is_pro: false,
        subscription_status: 'free',
        revenuecat_app_user_id: randomUUID(),
        app_subscription_status: 'free',
        daily_usage_count: 0,
        monthly_usage_count: 0,
        free_lifetime_pages_used: 0,
        last_usage_date: new Date().toISOString().slice(0, 10),
        usage_month: new Date().toISOString().slice(0, 7),
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });
      if (error) throw new Error(`Unable to create account: ${error.message}`);
    }

    user = await loadUser(normalizedEmail);
    if (!user) throw new Error('Account was not found after sign in');

    const response = NextResponse.json({
      success: true,
      isNewUser,
      user: await toResponseUser(user),
    });
    setSessionCookie(response, normalizedEmail);
    return response;
  } catch (error: any) {
    console.error('[google-auth]', error);
    const status = /credential|identity token|access token|issuer|audience|signature|expired/i.test(error.message)
      ? 401
      : 500;
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status });
  }
}
