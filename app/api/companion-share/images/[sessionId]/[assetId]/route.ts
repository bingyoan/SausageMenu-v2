import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';
import { COMPANION_SHARE_BUCKET, getBearerToken, isUuid, noStoreHeaders } from '@/lib/companionShare';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

export async function GET(request: NextRequest, { params }: { params: { sessionId: string; assetId: string } }) {
  if (!isUuid(params.sessionId) || !isUuid(params.assetId) || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return new Response('Not found', { status: 404, headers: noStoreHeaders() });
  }
  const token = getBearerToken(request);
  if (!token) return new Response('Not found', { status: 404, headers: noStoreHeaders() });

  const admin = getSupabaseService();
  const { data: session, error: sessionError } = await admin
    .from('companion_order_sessions')
    .select('id, payload, expires_at, revoked_at')
    .eq('id', params.sessionId)
    .eq('token_hash', tokenHash(token))
    .maybeSingle();
  if (sessionError || !session || session.revoked_at || Date.parse(session.expires_at) <= Date.now()) {
    return new Response('Not found', { status: 404, headers: noStoreHeaders() });
  }
  const pages = Array.isArray(session.payload?.pages) ? session.payload.pages : [];
  if (!pages.some((page: any) => page.imageAssetId === params.assetId)) {
    return new Response('Not found', { status: 404, headers: noStoreHeaders() });
  }

  const path = `${params.sessionId}/${params.assetId}.jpg`;
  const { data, error } = await admin.storage.from(COMPANION_SHARE_BUCKET).download(path);
  if (error || !data) return new Response('Not found', { status: 404, headers: noStoreHeaders() });
  return new Response(data, {
    status: 200,
    headers: {
      ...noStoreHeaders(),
      'Content-Type': 'image/jpeg',
      'Content-Length': String(data.size),
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
