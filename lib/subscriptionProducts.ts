const DEFAULT_MANAGED_SUBSCRIPTION_PRODUCTS = [
  'com.sausagemenu.pro.monthly',
  'com.sausagemenu.pro.yearly',
  'sm_pro_monthly',
  'sm_pro_year',
];

export function getManagedSubscriptionProductIds(): string[] {
  const configured = (
    process.env.NEXT_PUBLIC_REVENUECAT_SUBSCRIPTION_PRODUCT_IDS ||
    process.env.REVENUECAT_SUBSCRIPTION_PRODUCT_IDS ||
    ''
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_MANAGED_SUBSCRIPTION_PRODUCTS, ...configured])];
}

export function isManagedSubscriptionProductId(productId?: string | null): boolean {
  if (!productId) return false;
  return getManagedSubscriptionProductIds().some(
    (allowedId) => productId === allowedId || productId.startsWith(`${allowedId}:`),
  );
}
