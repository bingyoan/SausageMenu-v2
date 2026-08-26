import { getSupabaseService } from '@/lib/supabase';
import {
  isManagedAppProductId,
  isManagedLifetimeProductId,
  isManagedSubscriptionProductId,
} from '@/lib/subscriptionProducts';

export const REVENUECAT_ENTITLEMENT_ID = process.env.REVENUECAT_ENTITLEMENT_ID || 'pro';
const REVENUECAT_PROMOTIONAL_PRODUCT_PREFIX = 'rc_promo_';

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

interface RevenueCatNonSubscription {
  purchase_date?: string | null;
  store?: string | null;
}

interface RevenueCatSubscriberResponse {
  subscriber?: {
    original_app_user_id?: string | null;
    entitlements?: Record<string, RevenueCatEntitlement>;
    subscriptions?: Record<string, RevenueCatSubscription>;
    non_subscriptions?: Record<string, RevenueCatNonSubscription[]>;
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
const isValidTimestamp = (value?: string | null) => Boolean(value && Number.isFinite(new Date(value).getTime()));

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

function isAnonymousAppUserId(value?: string | null): boolean {
  return Boolean(value && /^\$rcanonymousid:/i.test(value.trim()));
}

function subscriptionFromPayload(
  payload: RevenueCatSubscriberResponse,
  requestedAppUserId: string,
): AppSubscriptionSnapshot {
  const subscriber = payload.subscriber || {};
  const originalAppUserId = subscriber.original_app_user_id?.trim();

  // RevenueCat can preserve an anonymous original ID when a store receipt is
  // restored after the user signs in. Allow that safe anonymous-to-identified
  // merge, while continuing to reject transfers between two identified app
  // accounts unless the RevenueCat dashboard explicitly moved the purchase.
  if (
    !originalAppUserId ||
    (originalAppUserId.toLowerCase() !== requestedAppUserId.toLowerCase() &&
      !isAnonymousAppUserId(originalAppUserId))
  ) {
    console.error('[RevenueCat] Rejected subscription owned by another app account', {
      requestedAppUserId,
      originalAppUserId: originalAppUserId || '(missing)',
    });
    return {
      isActive: false,
      status: 'free',
      productId: null,
      platform: null,
      expiresAt: null,
    };
  }

  const entitlement = subscriber.entitlements?.[REVENUECAT_ENTITLEMENT_ID];
  let productId = entitlement?.product_identifier || null;
  let subscription = productId ? subscriber.subscriptions?.[productId] : undefined;
  let nonSubscription = productId
    ? subscriber.non_subscriptions?.[productId]?.[0]
    : undefined;

  // RevenueCat can expose a manually granted promotional entitlement in both
  // `entitlements` and `subscriptions`.  The latter is especially common for
  // custom-duration grants (for example `rc_promo_pro_custom`).  Resolve that
  // product before applying the managed store-product allowlist, otherwise a
  // valid dated grant is incorrectly rejected as a non-subscription product.
  if (!productId) {
    const promotionalEntry = Object.entries(subscriber.subscriptions || {}).find(
      ([candidateId]) => candidateId.startsWith(REVENUECAT_PROMOTIONAL_PRODUCT_PREFIX),
    );
    if (promotionalEntry) {
      [productId, subscription] = promotionalEntry;
    }
  }

  if (productId?.startsWith(REVENUECAT_PROMOTIONAL_PRODUCT_PREFIX)) {
    const promotionalExpirationCandidates = [
      entitlement?.expires_date,
      subscription?.expires_date,
      entitlement?.grace_period_expires_date,
      subscription?.grace_period_expires_date,
    ];
    const promotionalExpiresAt =
      promotionalExpirationCandidates.find((value) => isFuture(value)) ||
      promotionalExpirationCandidates.find((value) => isValidTimestamp(value)) ||
      null;

    // Promotional access is only valid while a finite expiration is in the
    // future.  Lifetime/undated promotional grants remain rejected.
    if (isFuture(promotionalExpiresAt)) {
      return {
        isActive: true,
        status: 'active',
        productId,
        platform: null,
        expiresAt: promotionalExpiresAt,
      };
    }

    return {
      isActive: false,
      status: isValidTimestamp(promotionalExpiresAt) ? 'expired' : 'free',
      productId,
      platform: null,
      expiresAt: isValidTimestamp(promotionalExpiresAt) ? promotionalExpiresAt : null,
    };
  }

  // Store transactions can arrive before RevenueCat refreshes the entitlement
  // mapping. Only known products are accepted by this fallback. Recurring
  // products must have an active subscription record; a lifetime product must
  // have a matching non-subscription store transaction.
  if (!subscription || !isManagedSubscriptionProductId(productId)) {
    const managedEntry = Object.entries(subscriber.subscriptions || {}).find(
      ([candidateId, candidate]) => {
        if (!isManagedSubscriptionProductId(candidateId)) return false;
        return isFuture(candidate.expires_date) || isFuture(candidate.grace_period_expires_date);
      },
    );
    if (managedEntry) {
      [productId, subscription] = managedEntry;
    }
  }

  if (!subscription || !isManagedSubscriptionProductId(productId)) {
    const managedLifetimeEntry = Object.entries(subscriber.non_subscriptions || {}).find(
      ([candidateId, transactions]) =>
        isManagedLifetimeProductId(candidateId) && transactions.length > 0,
    );
    if (managedLifetimeEntry) {
      [productId] = managedLifetimeEntry;
      nonSubscription = managedLifetimeEntry[1][0];
      subscription = undefined;
    }
  }

  if (!productId || !isManagedAppProductId(productId)) {
    return { isActive: false, status: 'free', productId, platform: null, expiresAt: null };
  }

  // A lifetime product is valid only when RevenueCat reports the corresponding
  // paid store transaction. Promotional rc_promo_* products are handled above
  // and still require a finite future expiry; they can never become lifetime.
  if (isManagedLifetimeProductId(productId)) {
    if (!nonSubscription) {
      return { isActive: false, status: 'free', productId, platform: null, expiresAt: null };
    }

    return {
      isActive: true,
      status: 'active',
      productId,
      platform: storeToPlatform(nonSubscription.store),
      expiresAt: null,
    };
  }

  if (!subscription || !isManagedSubscriptionProductId(productId)) {
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
        (await response.json()) as RevenueCatSubscriberResponse,
        appUserId,
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
