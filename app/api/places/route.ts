import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Google API key is not configured' }, { status: 500 });
  }

  try {
    if (action === 'autocomplete') {
      const q = searchParams.get('q');
      if (!q) return NextResponse.json({ predictions: [] });
      
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${GOOGLE_API_KEY}&language=zh-TW`;
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json(data);
    } 
    
    if (action === 'details') {
      const place_id = searchParams.get('place_id');
      if (!place_id) return NextResponse.json({ error: 'Missing place_id' }, { status: 400 });

      // Only fetch the geometry field to save costs and data
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=geometry&key=${GOOGLE_API_KEY}&language=zh-TW`;
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'findPlace') {
      const q = searchParams.get('q');
      if (!q) return NextResponse.json({ candidates: [] });
      
      // 1. 先嘗試用 Text Search (適合完整景點、餐廳)
      const placeUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${GOOGLE_API_KEY}&language=zh-TW`;
      const placeRes = await fetch(placeUrl);
      const placeData = await placeRes.json();
      
      if (placeData.results && placeData.results.length > 0) {
        return NextResponse.json({
          candidates: [
            { geometry: placeData.results[0].geometry }
          ]
        });
      }

      // 2. 如果地標搜尋不到（例如：大範圍地名如 "河口湖" 或單純地址），改用 Geocoding API
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${GOOGLE_API_KEY}&language=zh-TW`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (geoData.results && geoData.results.length > 0) {
        return NextResponse.json({
          candidates: [
            { geometry: geoData.results[0].geometry }
          ]
        });
      }

      return NextResponse.json({ candidates: [] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Places API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
