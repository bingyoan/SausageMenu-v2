import { getSupabaseService } from '@/lib/supabase';

export const REVENUECAT_ENTITLEMENT_ID = process.env.REVENUECAT_ENTITLEMENT_ID || 'pro';

export type AppSubscriptionStatus =
  | 'free'
  | 'active'
  | 'grace_period'
  | 'billing_issue'
  | 'expired';

interface RevenueCatEntitlement {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  product_identifier?: string | null;
}

interface RevenueCatSubscription {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  billing_issues_detected_at?: string | null;
  store?: string | null;
}

interface RevenueCatSubscriberResponse {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
    subscriptions?: Record<string, RevenueCatSubscription>;
  };
}

interface RevenueCatApiKeyCandidate {
  label: string;
  value: string;
}

export interface AppSubscriptionSnapshot {
  isActive: boolean;
  status: AppSubscriptionStatus;
  productId: string | null;
  platform: 'ios' | 'android' | null;
  expiresAt: string | null;
}

const isFuture = (value?: string | null) => Boolean(value && new Date(value).getTime() > Date.now());

export function isActiveAppSubscription(user: {
  app_subscription_status?: string | null;
  app_subscription_expires_at?: string | null;
}): boolean {
  const allowedStatuses = new Set(['active', 'grace_period', 'billing_issue']);
  if (!allowedStatuses.has(user.app_subscription_status || '')) return false;
  return !user.app_subscription_expires_at || isFuture(user.app_subscription_expires_at);
}

function storeToPlatform(store?: string | null): 'ios' | 'android' | null {
  if (store === 'app_store' || store === 'mac_app_store') return 'ios';
  if (store === 'play_store') return 'android';
  return null;
}

function getRevenueCatApiKeys(): RevenueCatApiKeyCandidate[] {
  const candidates = [
    { label: 'secret', value: process.env.REVENUECAT_SECRET_API_KEY?.trim() || '' },
    { label: 'apple', value: process.env.NEXT_PUBLIC_REVENUECAT_APPLE_KEY?.trim() || '' },
    { label: 'google', value: process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY?.trim() || '' },
  ];
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (!candidate.value || seen.has(candidate.value)) return false;
    seen.add(candidate.value);
    return true;
  });
}

function subscriptionFromPayload(payload: RevenueCatSubscriberResponse): AppSubscriptionSnapshot {
  const subscriber = payload.subscriber || {};
  const entitlement = subscriber.entitlements?.[REVENUECAT_ENTITLEMENT_ID];
  const productId = entitlement?.product_identifier || null;
  const subscription = productId ? subscriber.subscriptions?.[productId] : undefined;

  // A RevenueCat lifetime/non-subscription product must never unlock the new
  // managed-key app plan. Only an actual store subscription is accepted.
  if (!entitlement || !productId || !subscription) {
    return { isActive: false, status: 'free', productId, platform: null, expiresAt: null };
  }

  const expiresAt = subscription.expires_date || entitlement.expires_date || null;
  const graceExpiresAt = subscription.grace_period_expires_date || entitlement.grace_period_expires_date || null;
  const inGracePeriod = isFuture(graceExpiresAt);
  const active = !expiresAt || isFuture(expiresAt) || inGracePeriod;

  let status: AppSubscriptionStatus = active ? 'active' : 'expired';
  if (active && inGracePeriod) status = 'grace_period';
  else if (active && subscription.billing_issues_detected_at) status = 'billing_issue';

  return {
    isActive: active,
    status,
    productId,
    platform: storeToPlatform(subscription.store),
    expiresAt: inGracePeriod ? graceExpiresAt : expiresAt,
  };
}

export async function fetchRevenueCatSubscription(appUserId: string): Promise<AppSubscriptionSnapshot> {
  const apiKeys = getRevenueCatApiKeys();
  if (apiKeys.length === 0) throw new Error('RevenueCat API keys are not configured');

  const failures: string[] = [];
  let inactiveSnapshot: AppSubscriptionSnapshot | null = null;

  for (const apiKey of apiKeys) {
    try {
      const response = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey.value}`,
          },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        failures.push(`${apiKey.label}:${response.status}`);
        continue;
      }

      const snapshot = subscriptionFromPayload(
        (await response.json()) as RevenueCatSubscriberResponse
      );
      if (snapshot.isActive) return snapshot;
      inactiveSnapshot = snapshot;
    } catch (error: any) {
      failures.push(`${apiKey.label}:${error?.name || 'request_failed'}`);
    }
  }

  if (inactiveSnapshot) return inactiveSnapshot;
  throw new Error(`RevenueCat customer lookup failed (${failures.join(', ')})`);
}

export async function syncRevenueCatSubscription(appUserId: string): Promise<AppSubscriptionSnapshot> {
  const snapshot = await fetchRevenueCatSubscription(appUserId);
  const supabase = getSupabaseService();

  const { data, error } = await supabase
    .from('users')
    .update({
      app_subscription_status: snapshot.status,
      app_subscription_product_id: snapshot.productId,
      app_subscription_platform: snapshot.platform,
      app_subscription_expires_at: snapshot.expiresAt,
      app_subscription_updated_at: new Date().toISOString(),
    })
    .eq('revenuecat_app_user_id', appUserId)
    .select('email')
    .maybeSingle();

  if (error) throw new Error(`Supabase subscription update failed: ${error.message}`);
  if (!data) throw new Error('No app account matches this RevenueCat customer');

  return snapshot;
}
