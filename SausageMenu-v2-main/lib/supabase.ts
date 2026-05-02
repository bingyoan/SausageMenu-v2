import { createClient } from '@supabase/supabase-js';
import { UserCountryStat } from '../types';

// Helper to safely access process.env without crashing in strict ESM environments if process is undefined
const getEnv = (key: string) => {
  try {
    return process.env[key];
  } catch (e) {
    return undefined;
  }
};

// 1. Try Next.js env var
// 2. Try Create React App env var
// 3. Fallback to the provided keys directly to ensure the app works immediately
const supabaseUrl =
  getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnv('REACT_APP_SUPABASE_URL') ||
  '';

const supabaseAnonKey =
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnv('REACT_APP_SUPABASE_ANON_KEY') ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase environment variables are missing.');
}

// Create client with explicit strings to avoid "supabaseUrl is required" error during build time
// If env vars are missing (e.g. during build), we use placeholders to prevent crash.
// The app will functionally fail at runtime if these aren't set, which is expected.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// 取得總用戶數
export async function getTotalUsers(): Promise<number> {
  const { data, error } = await supabase
    .from('total_users')
    .select('count')
    .eq('id', 1)
    .single();

  console.log('[getTotalUsers] Raw data from Supabase:', JSON.stringify(data));
  console.log('[getTotalUsers] Error:', error);

  if (error) {
    console.error('Error fetching total users:', error);
    return 0;
  }

  return data?.count || 0;
}

// 增加總用戶數
export async function incrementTotalUsers(): Promise<number> {
  const currentCount = await getTotalUsers();
  const newCount = currentCount + 1;

  const { error } = await supabase
    .from('total_users')
    .update({ count: newCount, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) {
    console.error('Error incrementing total users:', error);
    return currentCount;
  }

  return newCount;
}

// 增加特定國家的用戶數
export async function incrementCountryStat(countryCode: string): Promise<void> {
  // 1. 先嘗試取得該國目前的數據
  const { data, error: fetchError } = await supabase
    .from('user_stats')
    .select('user_count')
    .eq('country_code', countryCode)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error('Error fetching country stat:', fetchError);
    return;
  }

  if (data) {
    // 2. 如果存在，則更新 +1
    const { error: updateError } = await supabase
      .from('user_stats')
      .update({ user_count: (data.user_count || 0) + 1 })
      .eq('country_code', countryCode);

    if (updateError) console.error('Error updating country stat:', updateError);
  } else {
    // 3. 如果不存在，則建立新的紀錄 (初次出現的國家)
    // 這裡我們需要一個對應名稱的 helper，或者直接用 Code 當名稱
    const { error: insertError } = await supabase
      .from('user_stats')
      .insert({
        country_code: countryCode,
        country_name: countryCode, // 暫時用 Code 代替，或維持預設
        user_count: 1
      });

    if (insertError) console.error('Error inserting new country stat:', insertError);
  }
}

// 取得各國用戶統計
export async function getUserStats(): Promise<UserCountryStat[]> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('country_code, country_name, user_count')
    .order('user_count', { ascending: false });

  if (error) {
    console.error('Error fetching user stats:', error);
    return [];
  }

  // Get flag-mapping helper (simplified)
  const getFlag = (code: string) => {
    const flags: Record<string, string> = {
      'TW': '🇹🇼', 'JP': '🇯🇵', 'KR': '🇰🇷', 'TH': '🇹🇭', 'US': '🇺🇸', 'HK': '🇭🇰', 'SG': '🇸🇬', 'VN': '🇻🇳',
      'ID': '🇮🇩', 'FR': '🇫🇷', 'ES': '🇪🇸', 'DE': '🇩🇪', 'RU': '🇷🇺', 'PH': '🇵🇭', 'MY': '🇲🇾', 'CN': '🇨🇳'
    };
    return flags[code] || '🌐';
  };

  return (data || []).map(item => ({
    countryCode: item.country_code,
    countryName: item.country_name,
    userCount: item.user_count,
    flag: getFlag(item.country_code)
  }));
}