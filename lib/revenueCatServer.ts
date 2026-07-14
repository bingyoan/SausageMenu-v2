export interface RevenueCatProStatus {
  active: boolean;
  expiresAt: string | null;
}

export const getRevenueCatProStatus = async (appUserID: string): Promise<RevenueCatProStatus> => {
  const secret = (process.env.REVENUECAT_SECRET_API_KEY || '').trim();
  if (!secret) throw new Error('REVENUECAT_SECRET_API_KEY is not configured.');

  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserID)}`,
    {
      headers: { Authorization: `Bearer ${secret}`, Accept: 'application/json' },
      cache: 'no-store',
    }
  );
  if (!response.ok) throw new Error('RevenueCat could not verify this subscription.');

  const payload = await response.json();
  const entitlement = payload?.subscriber?.entitlements?.pro;
  const expiration = entitlement?.expires_date ? new Date(entitlement.expires_date) : null;
  return {
    active: Boolean(entitlement) && (!expiration || expiration.getTime() > Date.now()),
    expiresAt: expiration?.toISOString() || null,
  };
};
