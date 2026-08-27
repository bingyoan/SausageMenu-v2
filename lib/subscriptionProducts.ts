const DEFAULT_MANAGED_SUBSCRIPTION_PRODUCTS = [
  'com.sausagemenu.pro.monthly',
  'com.sausagemenu.pro.yearly',
  'sm_pro_monthly',
  'sm_pro_year',
];

// These are paid, one-time store products. They are intentionally kept
// separate from promotional RevenueCat products: a lifetime grant is never
// accepted unless RevenueCat also reports a matching store transaction.
const DEFAULT_MANAGED_LIFETIME_PRODUCTS = [
  // Existing App Store Connect non-consumable product (case-sensitive).
  'Sausagemenulifetime',
  'sm_lifetime',
  // Replacement Google Play non-consumable product used after the original
  // SKU became stuck in ITEM_ALREADY_OWNED during license testing.
  'sm_lifetime_v2',
];

function getConfiguredProductIds(...environmentKeys: string[]): string[] {
  for (const environmentKey of environmentKeys) {
    const configured = process.env[environmentKey]
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (configured && configured.length > 0) return configured;
  }
  return [];
}

export function getManagedSubscriptionProductIds(): string[] {
  const configured = getConfiguredProductIds(
    'NEXT_PUBLIC_REVENUECAT_SUBSCRIPTION_PRODUCT_IDS',
    'REVENUECAT_SUBSCRIPTION_PRODUCT_IDS',
  );

  return [...new Set([...DEFAULT_MANAGED_SUBSCRIPTION_PRODUCTS, ...configured])];
}

export function getManagedLifetimeProductIds(): string[] {
  const configured = getConfiguredProductIds(
    'NEXT_PUBLIC_REVENUECAT_LIFETIME_PRODUCT_IDS',
    'REVENUECAT_LIFETIME_PRODUCT_IDS',
  );

  return [...new Set([...DEFAULT_MANAGED_LIFETIME_PRODUCTS, ...configured])];
}

export function isManagedSubscriptionProductId(productId?: string | null): boolean {
  if (!productId) return false;
  return getManagedSubscriptionProductIds().some(
    (allowedId) => productId === allowedId || productId.startsWith(`${allowedId}:`),
  );
}

export function isManagedLifetimeProductId(productId?: string | null): boolean {
  if (!productId) return false;
  return getManagedLifetimeProductIds().some(
    (allowedId) => productId === allowedId || productId.startsWith(`${allowedId}:`),
  );
}

export function isManagedAppProductId(productId?: string | null): boolean {
  return isManagedSubscriptionProductId(productId) || isManagedLifetimeProductId(productId);
}
