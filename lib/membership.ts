export type MembershipSource = 'none' | 'web' | 'app' | 'both';

export interface MembershipRecord {
  is_pro?: boolean | null;
  pro_expires_at?: string | null;
  activation_pro_expires_at?: string | null;
  app_subscription_status?: string | null;
  app_subscription_expires_at?: string | null;
}

export interface MembershipAccess {
  isPro: boolean;
  source: MembershipSource;
  expiresAt: string | null;
  webActive: boolean;
  appActive: boolean;
}

const ACTIVE_APP_STATUSES = new Set(['active', 'grace_period', 'billing_issue']);

function isFuture(value?: string | null, now = Date.now()): boolean {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > now;
}

export function isActiveActivationMembership(
  user: Pick<MembershipRecord, 'activation_pro_expires_at'>,
  now = Date.now(),
): boolean {
  return isFuture(user.activation_pro_expires_at, now);
}

export function isActiveWebMembership(
  user: Pick<MembershipRecord, 'is_pro' | 'pro_expires_at'>,
  now = Date.now(),
): boolean {
  if (user.is_pro !== true) return false;
  return !user.pro_expires_at || isFuture(user.pro_expires_at, now);
}

export function isActiveStoredAppMembership(
  user: Pick<MembershipRecord, 'app_subscription_status' | 'app_subscription_expires_at'>,
  now = Date.now(),
): boolean {
  if (!ACTIVE_APP_STATUSES.has(user.app_subscription_status || '')) return false;
  return !user.app_subscription_expires_at || isFuture(user.app_subscription_expires_at, now);
}

function laterExpiration(first?: string | null, second?: string | null): string | null {
  // A missing expiration on an active source means lifetime access.
  if (!first || !second) return null;
  return new Date(first).getTime() >= new Date(second).getTime() ? first : second;
}

export function resolveMembershipAccess(
  user: MembershipRecord,
  appOverride?: { active: boolean; expiresAt?: string | null },
  now = Date.now(),
): MembershipAccess {
  const webActive = isActiveWebMembership(user, now);
  const storedAppActive = appOverride
    ? appOverride.active
    : isActiveStoredAppMembership(user, now);
  const activationActive = isActiveActivationMembership(user, now);
  const appActive = storedAppActive || activationActive;

  let source: MembershipSource = 'none';
  if (webActive && appActive) source = 'both';
  else if (webActive) source = 'web';
  else if (appActive) source = 'app';

  const webExpiresAt = webActive ? user.pro_expires_at || null : null;
  const appExpiresAt = combineActiveExpirations(
    { active: storedAppActive, expiresAt: appOverride?.expiresAt ?? user.app_subscription_expires_at ?? null },
    { active: activationActive, expiresAt: user.activation_pro_expires_at ?? null },
  );

  let expiresAt: string | null = null;
  if (source === 'web') expiresAt = webExpiresAt;
  else if (source === 'app') expiresAt = appExpiresAt;
  else if (source === 'both') expiresAt = laterExpiration(webExpiresAt, appExpiresAt);

  return {
    isPro: webActive || appActive,
    source,
    expiresAt,
    webActive,
    appActive,
  };
}

function combineActiveExpirations(
  ...sources: Array<{ active: boolean; expiresAt?: string | null }>
): string | null {
  const activeSources = sources.filter(source => source.active);
  if (activeSources.length === 0) return null;

  // Any active lifetime source keeps the combined membership lifetime.
  if (activeSources.some(source => !source.expiresAt)) return null;

  return activeSources
    .map(source => source.expiresAt as string)
    .reduce((latest, current) => (
      new Date(current).getTime() > new Date(latest).getTime() ? current : latest
    ));
}
