import { getSupabaseService } from '@/lib/supabase';

export const CREATOR_ATTRIBUTION_DAYS = 30;
export const CREATOR_COMMISSION_HOLD_DAYS = 45;

export function normalizeCreatorCode(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

export function isValidCreatorCode(value: string): boolean {
  return /^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(value);
}

export function isAnnualSubscriptionProduct(productId: unknown): boolean {
  if (typeof productId !== 'string') return false;
  const normalized = productId.toLowerCase();
  return normalized === 'com.sausagemenu.pro.yearly'
    || normalized === 'sm_pro_year'
    || normalized.startsWith('com.sausagemenu.pro.yearly:')
    || normalized.startsWith('sm_pro_year:');
}

export function revenueCatPlatform(store: unknown): 'ios' | 'android' | null {
  if (store === 'APP_STORE' || store === 'MAC_APP_STORE') return 'ios';
  if (store === 'PLAY_STORE') return 'android';
  return null;
}

export async function loadAffiliateUser(email: string) {
  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from('users')
    .select('email, revenuecat_app_user_id, app_subscription_status, app_subscription_expires_at')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();
  if (error) throw new Error(`Unable to load affiliate account: ${error.message}`);
  return data;
}

export function userAlreadySubscribed(user: any): boolean {
  if (!['active', 'grace_period', 'billing_issue'].includes(user?.app_subscription_status || '')) return false;
  if (!user?.app_subscription_expires_at) return true;
  return Date.parse(user.app_subscription_expires_at) > Date.now();
}
