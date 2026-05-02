import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Haversine distance in meters
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST: Upload or update a cached menu (with 50m dedup)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantName, restaurantCategory, address, lat, lng, menuData, thumbnail, targetLanguage,
      originalCurrency, targetCurrency, exchangeRate, detectedLanguage, uploaderName, itemCount, userId } = body;

    if (!restaurantName || !address || !lat || !lng || !menuData) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Dedup check: find existing menus within 50m with same restaurant name
    const searchRadius = 0.001; // ~111m in degrees, we'll filter precisely below
    const { data: nearby } = await supabase
      .from('cached_menus')
      .select('id, lat, lng, restaurant_name')
      .gte('lat', lat - searchRadius)
      .lte('lat', lat + searchRadius)
      .gte('lng', lng - searchRadius)
      .lte('lng', lng + searchRadius);

    let existingId = null;
    if (nearby) {
      for (const item of nearby) {
        const dist = haversineDistance(lat, lng, item.lat, item.lng);
        if (dist <= 50 && item.restaurant_name.toLowerCase() === restaurantName.toLowerCase()) {
          existingId = item.id;
          break;
        }
      }
    }

    const menuRecord = {
      restaurant_name: restaurantName,
      restaurant_category: restaurantCategory || null,
      address,
      lat,
      lng,
      menu_data: menuData,
      thumbnail: thumbnail || null,
      target_language: targetLanguage,
      original_currency: originalCurrency,
      target_currency: targetCurrency,
      exchange_rate: exchangeRate,
      detected_language: detectedLanguage,
      uploader_name: uploaderName || 'Anonymous',
      user_id: userId || null,
      item_count: itemCount || 0,
      updated_at: new Date().toISOString()
    };

    if (existingId) {
      // Update existing (dedup)
      const { error } = await supabase
        .from('cached_menus')
        .update(menuRecord)
        .eq('id', existingId);

      if (error) throw error;
      return NextResponse.json({ success: true, id: existingId, action: 'updated' });
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('cached_menus')
        .insert(menuRecord)
        .select('id')
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, id: data.id, action: 'created' });
    }
  } catch (err: any) {
    console.error('Menu cache POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET: Search nearby cached menus
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radiusKm = parseFloat(searchParams.get('radius') || '5');
    const lang = searchParams.get('lang') || '';

    if (!lat && !lng && !searchParams.has('minLat')) {
      // No location: return latest 50 menus globally
      let query = supabase
        .from('cached_menus')
        .select('id, restaurant_name, restaurant_category, address, lat, lng, target_language, original_currency, item_count, view_count, created_at, thumbnail, user_id')
        .order('created_at', { ascending: false })
        .limit(50);

      if (lang) query = query.eq('target_language', lang);
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, menus: data || [] });
    }

    if (searchParams.has('minLat')) {
      // Map Bounding Box Search
      const minLat = parseFloat(searchParams.get('minLat') || '-90');
      const maxLat = parseFloat(searchParams.get('maxLat') || '90');
      const minLng = parseFloat(searchParams.get('minLng') || '-180');
      const maxLng = parseFloat(searchParams.get('maxLng') || '180');

      let query = supabase
        .from('cached_menus')
        .select('id, restaurant_name, restaurant_category, address, lat, lng, target_language, original_currency, item_count, view_count, created_at, thumbnail, user_id')
        .gte('lat', minLat)
        .lte('lat', maxLat)
        .gte('lng', minLng)
        .lte('lng', maxLng)
        .limit(100);

      if (lang) query = query.eq('target_language', lang);
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, menus: data || [] });
    }

    // Search within bounding box based on center+radius (Old Behavior)
    const degreeRange = radiusKm / 111;
    let query = supabase
      .from('cached_menus')
      .select('id, restaurant_name, restaurant_category, address, lat, lng, target_language, original_currency, item_count, view_count, created_at, thumbnail, user_id')
      .gte('lat', lat - degreeRange)
      .lte('lat', lat + degreeRange)
      .gte('lng', lng - degreeRange)
      .lte('lng', lng + degreeRange);

    if (lang) query = query.eq('target_language', lang);
    const { data, error } = await query;
    if (error) throw error;

    // Filter by precise distance and add distance field
    const results = (data || [])
      .map(item => ({
        ...item,
        distance: Math.round(haversineDistance(lat, lng, item.lat, item.lng))
      }))
      .filter(item => item.distance <= radiusKm * 1000)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ success: true, menus: results });
  } catch (err: any) {
    console.error('Menu cache GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Remove a cached menu
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json({ success: false, error: 'Missing id or userId' }, { status: 400 });
    }

    // Verify ownership
    const { data: menu, error: fetchErr } = await supabase
      .from('cached_menus')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchErr || !menu) {
      return NextResponse.json({ success: false, error: 'Menu not found' }, { status: 404 });
    }

    if (menu.user_id !== userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized to delete this menu' }, { status: 403 });
    }

    // Perform deletion
    const { error: deleteErr } = await supabase
      .from('cached_menus')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (err: any) {
    console.error('Menu cache DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
