import { NextRequest, NextResponse } from 'next/server';
import { getRequestSession } from '@/lib/authSession';
import { getSupabaseService } from '@/lib/supabase';
import type { SavedMenu } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };
const MAX_MENUS = 100;
const MAX_PAYLOAD_BYTES = 20 * 1024 * 1024;

function requireSession(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return { error: NextResponse.json({ success: false, error: 'Session expired' }, { status: 401, headers: CACHE_HEADERS }) };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return { error: NextResponse.json({ success: false, error: 'Menu backup is unavailable' }, { status: 503, headers: CACHE_HEADERS }) };
  }
  return { email: session.email.trim().toLowerCase() };
}

function isSavedMenu(value: unknown): value is SavedMenu {
  if (!value || typeof value !== 'object') return false;
  const menu = value as Partial<SavedMenu>;
  return typeof menu.id === 'string' && menu.id.length > 0 && menu.id.length <= 180
    && typeof menu.createdAt === 'number' && Number.isFinite(menu.createdAt)
    && (menu.updatedAt === undefined || (typeof menu.updatedAt === 'number' && Number.isFinite(menu.updatedAt)))
    && typeof menu.customName === 'string'
    && typeof menu.thumbnailBase64 === 'string'
    && Boolean(menu.menuData && typeof menu.menuData === 'object')
    && typeof menu.targetLanguage === 'string'
    && typeof menu.itemCount === 'number' && Number.isFinite(menu.itemCount);
}

function fromSharedMenu(row: any): SavedMenu | null {
  if (!row?.id || !row?.menu_data || !row?.target_language) return null;
  const createdAt = Date.parse(row.created_at || row.updated_at || '') || Date.now();
  const updatedAt = Date.parse(row.updated_at || row.created_at || '') || createdAt;
  return {
    id: `shared_${row.id}`,
    createdAt,
    updatedAt,
    customName: row.restaurant_name || '已儲存菜單',
    restaurantName: row.restaurant_name || undefined,
    thumbnailBase64: row.thumbnail || '',
    menuData: row.menu_data,
    location: Number.isFinite(row.lat) && Number.isFinite(row.lng)
      ? { lat: row.lat, lng: row.lng }
      : undefined,
    targetLanguage: row.target_language,
    itemCount: Number.isFinite(row.item_count)
      ? row.item_count
      : Array.isArray(row.menu_data?.items) ? row.menu_data.items.length : 0,
  } as SavedMenu;
}

export async function GET(request: NextRequest) {
  const auth = requireSession(request);
  if ('error' in auth) return auth.error;

  try {
    const supabase = getSupabaseService();
    const [
      { data: stored, error: storedError },
      { data: deleted, error: deletedError },
      { data: shared, error: sharedError },
    ] = await Promise.all([
      supabase
        .from('saved_menu_library')
        .select('menu_id, menu_payload, updated_at')
        .eq('user_email', auth.email)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(MAX_MENUS),
      // Tombstones are loaded separately so a long deletion history can never
      // crowd live menus out of the 100-item library response.
      supabase
        .from('saved_menu_library')
        .select('menu_id, deleted_at')
        .eq('user_email', auth.email)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(500),
      // Only menus explicitly shared by the currently authenticated owner are
      // eligible for recovery. Public/anonymous rows are never imported.
      supabase
        .from('cached_menus')
        .select('id, restaurant_name, lat, lng, menu_data, thumbnail, target_language, item_count, created_at, updated_at')
        .eq('user_id', auth.email)
        .order('updated_at', { ascending: false })
        .limit(MAX_MENUS),
    ]);

    if (storedError) throw storedError;
    if (deletedError) throw deletedError;
    if (sharedError) throw sharedError;

    const deletedMenus = (deleted || [])
      .map((row: any) => ({ id: row.menu_id, deletedAt: Date.parse(row.deleted_at) || Date.now() }));
    const deletedIds = new Set(deletedMenus.map((item: any) => item.id));
    const menus = (stored || [])
      .map((row: any) => ({ ...row.menu_payload, updatedAt: Date.parse(row.updated_at) || row.menu_payload?.updatedAt }))
      .filter(isSavedMenu);
    const recoveredFromMap = (shared || [])
      .map(fromSharedMenu)
      .filter((menu): menu is SavedMenu => Boolean(menu && !deletedIds.has(menu.id)));

    return NextResponse.json(
      { success: true, menus, recoveredFromMap, deletedMenus },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error('[menu-library] load failed:', error);
    return NextResponse.json(
      { success: false, error: 'Menu backup could not be loaded' },
      { status: 503, headers: CACHE_HEADERS },
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireSession(request);
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const menus = Array.isArray(body?.menus) ? body.menus.slice(0, MAX_MENUS) : null;
    if (!menus || menus.some((menu: unknown) => !isSavedMenu(menu))) {
      return NextResponse.json({ success: false, error: 'Invalid menu library payload' }, { status: 400, headers: CACHE_HEADERS });
    }
    if (Buffer.byteLength(JSON.stringify(menus), 'utf8') > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ success: false, error: 'Menu library payload is too large' }, { status: 413, headers: CACHE_HEADERS });
    }
    if (menus.length === 0) {
      return NextResponse.json({ success: true, synced: 0 }, { headers: CACHE_HEADERS });
    }

    const now = new Date().toISOString();
    const rows = menus.map((menu: SavedMenu) => ({
      user_email: auth.email,
      menu_id: menu.id,
      menu_payload: menu,
      created_at: new Date(menu.createdAt).toISOString(),
      updated_at: new Date(menu.updatedAt || menu.createdAt).toISOString(),
      deleted_at: null,
    }));
    const { error } = await getSupabaseService()
      .from('saved_menu_library')
      .upsert(rows.map(row => ({ ...row, updated_at: row.updated_at || now })), { onConflict: 'user_email,menu_id' });
    if (error) throw error;

    return NextResponse.json({ success: true, synced: rows.length }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('[menu-library] sync failed:', error);
    return NextResponse.json({ success: false, error: 'Menu backup could not be synced' }, { status: 503, headers: CACHE_HEADERS });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireSession(request);
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const menuId = typeof body?.id === 'string' ? body.id.trim() : '';
    if (!menuId || menuId.length > 180) {
      return NextResponse.json({ success: false, error: 'Invalid menu id' }, { status: 400, headers: CACHE_HEADERS });
    }

    const deletedAt = new Date().toISOString();
    const { error } = await getSupabaseService()
      .from('saved_menu_library')
      .upsert({
        user_email: auth.email,
        menu_id: menuId,
        menu_payload: null,
        updated_at: deletedAt,
        deleted_at: deletedAt,
      }, { onConflict: 'user_email,menu_id' });
    if (error) throw error;

    return NextResponse.json({ success: true }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('[menu-library] delete failed:', error);
    return NextResponse.json({ success: false, error: 'Menu backup could not be updated' }, { status: 503, headers: CACHE_HEADERS });
  }
}
