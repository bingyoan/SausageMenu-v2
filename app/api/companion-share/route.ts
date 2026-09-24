import { createHash, randomBytes, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestSession } from '@/lib/authSession';
import { getSupabaseService } from '@/lib/supabase';
import {
  allowedShareItems,
  cleanText,
  COMPANION_SHARE_BUCKET,
  COMPANION_SHARE_MAX_BODY_BYTES,
  COMPANION_SHARE_TTL_HOURS,
  CompanionSharePayload,
  isUuid,
  noStoreHeaders,
} from '@/lib/companionShare';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStoreHeaders() });
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

function owner(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) return { response: json({ success: false, error: '請先登入後再建立分享' }, 401) };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return { response: json({ success: false, error: '分享服務尚未設定完成' }, 503) };
  }
  return { email: session.email.trim().toLowerCase() };
}

async function removeImages(admin: ReturnType<typeof getSupabaseService>, sessionId: string, payload: any) {
  const pages = Array.isArray(payload?.pages) ? payload.pages : [];
  const paths = pages
    .filter((page: any) => typeof page?.imageAssetId === 'string' && isUuid(page.imageAssetId))
    .map((page: any) => `${sessionId}/${page.imageAssetId}.jpg`);
  if (paths.length) {
    const { error } = await admin.storage.from(COMPANION_SHARE_BUCKET).remove(paths);
    if (error) console.warn('[companion-share] private image cleanup failed');
  }
}

async function cleanupExpired(admin: ReturnType<typeof getSupabaseService>) {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('companion_order_sessions')
    .select('id, payload')
    .lt('expires_at', now)
    .limit(25);
  if (error || !data?.length) return;
  for (const row of data) await removeImages(admin, row.id, row.payload);
  const { error: deleteError } = await admin
    .from('companion_order_sessions')
    .delete()
    .in('id', data.map(row => row.id));
  if (deleteError) console.warn('[companion-share] expired session cleanup failed');
}

function sanitizePayload(mode: unknown, titleValue: unknown, raw: any, sessionId: string) {
  const title = cleanText(titleValue, 120) || '旅伴共用點餐清單';
  if (mode === 'menu') {
    const rawItems = Array.isArray(raw?.items) ? raw.items : null;
    if (!rawItems || rawItems.length < 1 || rawItems.length > 200) return null;
    const items = rawItems.map((item: any) => ({
      id: cleanText(item?.id, 180),
      originalName: cleanText(item?.originalName, 500),
      translatedName: cleanText(item?.translatedName, 500),
      price: Number.isFinite(item?.price) ? Math.max(0, Math.min(1_000_000, Number(item.price))) : undefined,
      currency: cleanText(item?.currency, 8),
    }));
    if (items.some((item: any) => !item.id || (!item.originalName && !item.translatedName))) return null;
    if (new Set(items.map((item: any) => item.id)).size !== items.length) return null;
    return {
      payload: {
        mode,
        title,
        restaurantName: cleanText(raw?.restaurantName, 120),
        currency: cleanText(raw?.currency, 8),
        targetLanguage: cleanText(raw?.targetLanguage, 40),
        items,
      } satisfies CompanionSharePayload,
      uploads: [] as Array<{ assetId: string; bytes: Buffer }>,
    };
  }

  if (mode === 'instant') {
    const rawPages = Array.isArray(raw?.pages) ? raw.pages : null;
    if (!rawPages || rawPages.length < 1 || rawPages.length > 4) return null;
    const uploads: Array<{ assetId: string; bytes: Buffer }> = [];
    const pages = rawPages.map((page: any) => {
      const pageId = cleanText(page?.id, 80);
      const base64 = typeof page?.imageBase64 === 'string' ? page.imageBase64 : '';
      if (!pageId || !/^[A-Za-z0-9_-]+$/.test(pageId) || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length > 7_000_000) return null;
      const bytes = Buffer.from(base64, 'base64');
      if (bytes.length < 4 || bytes.length > 5 * 1024 * 1024 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return null;
      const regions = Array.isArray(page?.regions) ? page.regions.slice(0, 500).map((region: any) => {
        const polygon = Array.isArray(region?.polygon) && region.polygon.length >= 3
          ? region.polygon.slice(0, 8).map((point: any) => ({ x: Number(point?.x), y: Number(point?.y) }))
          : undefined;
        return {
          id: cleanText(region?.id, 120),
          originalText: cleanText(region?.originalText, 500),
          translatedText: cleanText(region?.translatedText, 500),
          kind: cleanText(region?.kind, 32),
          polygon: polygon?.every(point => Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1) ? polygon : undefined,
        };
      }) : [];
      if (regions.some((region: any) => !region.id || (!region.originalText && !region.translatedText))) return null;
      const imageAssetId = randomUUID();
      uploads.push({ assetId: imageAssetId, bytes });
      return {
        id: pageId,
        width: Math.max(1, Math.min(1920, Math.floor(Number(page?.width) || 1))),
        height: Math.max(1, Math.min(1920, Math.floor(Number(page?.height) || 1))),
        imageAssetId,
        regions,
      };
    });
    if (pages.some((page: any) => !page)) return null;
    return {
      payload: {
        mode,
        title,
        targetLanguage: cleanText(raw?.targetLanguage, 40),
        pages,
      } satisfies CompanionSharePayload,
      uploads,
    };
  }
  return null;
}

export async function POST(request: NextRequest) {
  const auth = owner(request);
  if ('response' in auth) return auth.response;

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, 'utf8') > COMPANION_SHARE_MAX_BODY_BYTES) {
    return json({ success: false, error: '分享內容過大，請減少圖片數量或選擇較小的圖片' }, 413);
  }

  let body: any;
  try { body = JSON.parse(rawBody); } catch { return json({ success: false, error: '分享資料格式錯誤' }, 400); }

  const admin = getSupabaseService();
  await cleanupExpired(admin);
  const { data: active, error: activeError } = await admin
    .from('companion_order_sessions')
    .select('id')
    .eq('owner_email', auth.email)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .limit(5);
  if (activeError) {
    console.error('[companion-share] active session check failed');
    return json({ success: false, error: '分享服務尚未啟用，請先套用資料庫更新' }, 503);
  }
  if ((active || []).length >= 5) return json({ success: false, error: '目前已有 5 個有效分享，請先關閉不再使用的分享' }, 429);

  const id = randomUUID();
  const shareToken = randomBytes(32).toString('base64url');
  const normalized = sanitizePayload(body?.mode, body?.title, body?.payload, id);
  if (!normalized) return json({ success: false, error: '分享內容不完整，請返回重新載入後再試' }, 400);

  const totalUploadBytes = normalized.uploads.reduce((sum, upload) => sum + upload.bytes.length, 0);
  if (totalUploadBytes > 8 * 1024 * 1024) return json({ success: false, error: '圖片總大小超過限制，請減少圖片數量' }, 413);

  const uploadedPaths: string[] = [];
  try {
    for (const upload of normalized.uploads) {
      const path = `${id}/${upload.assetId}.jpg`;
      const { error } = await admin.storage.from(COMPANION_SHARE_BUCKET).upload(path, upload.bytes, {
        contentType: 'image/jpeg',
        cacheControl: '0',
        upsert: false,
      });
      if (error) throw error;
      uploadedPaths.push(path);
    }

    const expiresAt = new Date(Date.now() + COMPANION_SHARE_TTL_HOURS * 60 * 60 * 1000).toISOString();
    const { error: sessionError } = await admin.from('companion_order_sessions').insert({
      id,
      owner_email: auth.email,
      mode: normalized.payload.mode,
      title: normalized.payload.title,
      payload: normalized.payload,
      token_hash: tokenHash(shareToken),
      expires_at: expiresAt,
    });
    if (sessionError) throw sessionError;

    const allowed = allowedShareItems(normalized.payload);
    const rawSelections = Array.isArray(body?.ownerSelections) ? body.ownerSelections.slice(0, 200) : [];
    const entries = [];
    for (const selection of rawSelections) {
      const key = cleanText(selection?.key, 180);
      const quantity = Number(selection?.quantity);
      const item = allowed.get(key);
      if (!item || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error('Invalid owner selection');
      }
      entries.push({
        session_id: id,
        guest_id: 'host',
        guest_name: '建立者',
        item_key: key,
        original_name: item.original,
        translated_name: item.translated,
        quantity,
      });
    }
    if (entries.length) {
      const { error } = await admin.from('companion_order_entries').insert(entries);
      if (error) throw error;
    }

    return json({ success: true, id, token: shareToken, expiresAt });
  } catch (error) {
    if (uploadedPaths.length) await admin.storage.from(COMPANION_SHARE_BUCKET).remove(uploadedPaths);
    await admin.from('companion_order_sessions').delete().eq('id', id);
    console.error('[companion-share] create failed:', error instanceof Error ? error.message : 'unknown error');
    return json({ success: false, error: '建立分享失敗，請稍後再試' }, 503);
  }
}

export async function GET(request: NextRequest) {
  const auth = owner(request);
  if ('response' in auth) return auth.response;
  const id = request.nextUrl.searchParams.get('sessionId') || '';
  if (!isUuid(id)) return json({ success: false, error: '分享已關閉或不存在' }, 404);

  const admin = getSupabaseService();
  const { data: session, error } = await admin
    .from('companion_order_sessions')
    .select('id, mode, title, payload, expires_at, revoked_at')
    .eq('id', id)
    .eq('owner_email', auth.email)
    .maybeSingle();
  if (error || !session) return json({ success: false, error: '分享已關閉或不存在' }, 404);
  if (session.revoked_at || Date.parse(session.expires_at) <= Date.now()) {
    return json({ success: false, error: '分享已到期或關閉' }, 410);
  }

  const { data: entries, error: entriesError } = await admin
    .from('companion_order_entries')
    .select('id, guest_id, guest_name, item_key, original_name, translated_name, quantity, updated_at')
    .eq('session_id', id)
    .order('created_at', { ascending: true });
  if (entriesError) return json({ success: false, error: '共用清單暫時無法載入' }, 503);
  return json({ success: true, session: { id, mode: session.mode, title: session.title, expiresAt: session.expires_at }, entries: entries || [] });
}

export async function DELETE(request: NextRequest) {
  const auth = owner(request);
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  const id = typeof body?.sessionId === 'string' ? body.sessionId : '';
  if (!isUuid(id)) return json({ success: false, error: '分享已關閉或不存在' }, 404);

  const admin = getSupabaseService();
  const { data: session, error } = await admin
    .from('companion_order_sessions')
    .select('id, payload')
    .eq('id', id)
    .eq('owner_email', auth.email)
    .maybeSingle();
  if (error || !session) return json({ success: false, error: '分享已關閉或不存在' }, 404);

  await removeImages(admin, id, session.payload);
  const { error: deleteError } = await admin.from('companion_order_sessions').delete().eq('id', id).eq('owner_email', auth.email);
  if (deleteError) return json({ success: false, error: '目前無法關閉分享，請稍後再試' }, 503);
  return json({ success: true });
}
