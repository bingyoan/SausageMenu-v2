import { NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SERVER_CACHE_MS = 10_000;
const CACHE_CONTROL = 'no-store, no-cache, must-revalidate, max-age=0';

type CountSnapshot = {
  count: number;
  updatedAt: string;
  cachedAt: number;
};

let cachedSnapshot: CountSnapshot | null = null;

export async function GET() {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshot.cachedAt < SERVER_CACHE_MS) {
    return NextResponse.json(
      { success: true, paidUserCount: cachedSnapshot.count, updatedAt: cachedSnapshot.updatedAt },
      { headers: { 'Cache-Control': CACHE_CONTROL } },
    );
  }

  // The database function is executable only by service_role and returns an aggregate,
  // so no member email or entitlement rows ever leave Postgres.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return NextResponse.json(
      { success: false, message: 'Membership statistics are unavailable.' },
      { status: 503, headers: { 'Cache-Control': CACHE_CONTROL } },
    );
  }

  try {
    const supabase = getSupabaseService();
    const { data, error } = await supabase.rpc('count_active_pro_accounts');
    if (error) throw error;

    const paidUserCount = Number(data);
    if (!Number.isSafeInteger(paidUserCount) || paidUserCount < 0) {
      throw new Error('The active PRO account count was not a valid integer.');
    }

    const updatedAt = new Date().toISOString();
    cachedSnapshot = { count: paidUserCount, updatedAt, cachedAt: Date.now() };
    return NextResponse.json(
      { success: true, paidUserCount, updatedAt },
      { headers: { 'Cache-Control': CACHE_CONTROL } },
    );
  } catch (error) {
    console.error('[paid-user-count] Failed to calculate active PRO count:', error);
    return NextResponse.json(
      { success: false, message: 'Membership statistics are unavailable.' },
      { status: 503, headers: { 'Cache-Control': CACHE_CONTROL } },
    );
  }
}
