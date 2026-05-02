import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// POST: 建立共享場次
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hostName, menuData, targetLanguage, originalCurrency, targetCurrency, exchangeRate } = body;

    if (!menuData || !menuData.items || menuData.items.length === 0) {
      return NextResponse.json({ success: false, error: 'No menu data provided' }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour

    const { data, error } = await supabase
      .from('shared_sessions')
      .insert({
        host_name: hostName || 'Host',
        menu_data: menuData,
        target_language: targetLanguage || 'English',
        original_currency: originalCurrency || '',
        target_currency: targetCurrency || '',
        exchange_rate: exchangeRate || 1,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id, created_at, expires_at')
      .single();

    if (error) {
      console.error('[share-session] Insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessionId: data.id,
      expiresAt: data.expires_at,
    });
  } catch (err: any) {
    console.error('[share-session] POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET: 取得共享場次
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing session id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('shared_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    // 檢查是否已過期
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    if (now > expiresAt) {
      return NextResponse.json({ success: false, error: 'Session expired', expired: true }, { status: 410 });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: data.id,
        hostName: data.host_name,
        menuData: data.menu_data,
        targetLanguage: data.target_language,
        originalCurrency: data.original_currency,
        targetCurrency: data.target_currency,
        exchangeRate: data.exchange_rate,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      }
    });
  } catch (err: any) {
    console.error('[share-session] GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
