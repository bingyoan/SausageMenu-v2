import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';
import {
  allowedShareItems,
  cleanText,
  COMPANION_SHARE_BUCKET,
  COMPANION_SHARE_MAX_BODY_BYTES,
  CompanionSharePayload,
  getBearerToken,
  isUuid,
  noStoreHeaders,
} from '@/lib/companionShare';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStoreHeaders() });
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

function adminOrError() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return null;
  return getSupabaseService();
}

async function activeSession(request: NextRequest) {
  const token = getBearerToken(request);
  const admin = adminOrError();
  if (!token || !admin) return null;
  const { data, error } = await admin
    .from('companion_order_sessions')
    .select('id, mode, title, payload, expires_at, revoked_at')
    .eq('token_hash', tokenHash(token))
    .maybeSingle();
  if (error || !data || data.revoked_at || Date.parse(data.expires_at) <= Date.now()) return null;
  return { session: data, admin };
}

function guestPayload(session: any, payload: CompanionSharePayload) {
  if (payload.mode !== 'instant' || !Array.isArray(payload.pages)) return payload;
  return {
    ...payload,
    pages: payload.pages.map(page => ({
      ...page,
      imageUrl: `/api/companion-share/images/${session.id}/${page.imageAssetId}`,
    })),
  };
}

export async function GET(request: NextRequest) {
  const result = await activeSession(request);
  if (!result) return json({ success: false, error: '此分享連結已失效或已關閉' }, 410);
  const { session, admin } = result;
  const { data: entries, error } = await admin
    .from('companion_order_entries')
    .select('id, guest_id, guest_name, item_key, original_name, translated_name, quantity, updated_at')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true });
  if (error) return json({ success: false, error: '共用清單暫時無法載入' }, 503);
  return json({
    success: true,
    session: {
      id: session.id,
      mode: session.mode,
      title: session.title,
      expiresAt: session.expires_at,
      payload: guestPayload(session, session.payload),
    },
    entries: entries || [],
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, 'utf8') > COMPANION_SHARE_MAX_BODY_BYTES) return json({ success: false, error: '請求內容過大' }, 413);
  let body: any;
  try { body = JSON.parse(rawBody); } catch { return json({ success: false, error: '請求內容格式錯誤' }, 400); }

  const result = await activeSession(request);
  if (!result) return json({ success: false, error: '此分享連結已失效或已關閉' }, 410);
  const { session, admin } = result;
  const guestId = typeof body?.guestId === 'string' ? body.guestId.trim().toLowerCase() : '';
  const guestName = cleanText(body?.guestName, 48);
  const itemKey = cleanText(body?.itemKey, 180);
  const quantity = Number(body?.quantity);
  if (!isUuid(guestId) || guestId === 'host' || !guestName || !itemKey || !Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    return json({ success: false, error: '品項資料不正確' }, 400);
  }

  const payload = session.payload as CompanionSharePayload;
  const item = allowedShareItems(payload).get(itemKey);
  if (!item) return json({ success: false, error: '找不到這個菜單品項，請重新整理' }, 400);

  const { data: ownRows, error: ownRowsError } = await admin
    .from('companion_order_entries')
    .select('item_key')
    .eq('session_id', session.id)
    .eq('guest_id', guestId)
    .limit(100);
  if (ownRowsError) return json({ success: false, error: '共用清單暫時無法更新' }, 503);

  if (!ownRows?.length && quantity > 0) {
    const { data: guestRows, error: guestRowsError } = await admin
      .from('companion_order_entries')
      .select('guest_id')
      .eq('session_id', session.id)
      .limit(600);
    if (guestRowsError) return json({ success: false, error: '共用清單暫時無法更新' }, 503);
    const knownGuests = new Set((guestRows || []).map((row: any) => row.guest_id));
    if (knownGuests.size >= 31) return json({ success: false, error: '這份分享已達 30 位旅伴的上限' }, 429);
  }

  if (!ownRows?.some((row: any) => row.item_key === itemKey) && quantity > 0) {
    const { count, error: countError } = await admin
      .from('companion_order_entries')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id);
    if (countError) return json({ success: false, error: '共用清單暫時無法更新' }, 503);
    if ((count || 0) >= 600) return json({ success: false, error: '這份清單已達餐點數量上限' }, 429);
  }

  if (quantity === 0) {
    const { error } = await admin.from('companion_order_entries')
      .delete()
      .eq('session_id', session.id)
      .eq('guest_id', guestId)
      .eq('item_key', itemKey);
    if (error) return json({ success: false, error: '更新點餐內容失敗' }, 503);
  } else {
    const { error } = await admin.from('companion_order_entries').upsert({
      session_id: session.id,
      guest_id: guestId,
      guest_name: guestName,
      item_key: itemKey,
      original_name: item.original,
      translated_name: item.translated,
      quantity,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id,guest_id,item_key' });
    if (error) return json({ success: false, error: '更新點餐內容失敗' }, 503);
  }
  return json({ success: true });
}
