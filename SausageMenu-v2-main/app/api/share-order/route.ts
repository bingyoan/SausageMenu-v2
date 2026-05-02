import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// POST: 朋友提交訂單
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, guestName, items } = body;

    if (!sessionId || !guestName || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // 檢查 session 是否存在且未過期
    const { data: session, error: sessionError } = await supabase
      .from('shared_sessions')
      .select('id, expires_at')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const now = new Date();
    if (now > new Date(session.expires_at)) {
      return NextResponse.json({ success: false, error: 'Session expired' }, { status: 410 });
    }

    // 先刪除此人之前的訂單 (允許重新提交)
    await supabase
      .from('shared_orders')
      .delete()
      .eq('session_id', sessionId)
      .eq('guest_name', guestName);

    // 插入新的訂單行
    const rows = items.map((item: any) => ({
      session_id: sessionId,
      guest_name: guestName,
      item_id: item.itemId,
      item_translated: item.itemTranslated || '',
      item_original: item.itemOriginal || '',
      price: item.price || 0,
      quantity: item.quantity || 1,
    }));

    const { error: insertError } = await supabase
      .from('shared_orders')
      .insert(rows);

    if (insertError) {
      console.error('[share-order] Insert error:', insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[share-order] POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET: 取得某場次的所有訂單 (發起者用)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing sessionId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('shared_orders')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[share-order] GET error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 按人分組
    const grouped: Record<string, any[]> = {};
    (data || []).forEach((row: any) => {
      if (!grouped[row.guest_name]) grouped[row.guest_name] = [];
      grouped[row.guest_name].push({
        itemId: row.item_id,
        itemTranslated: row.item_translated,
        itemOriginal: row.item_original,
        price: row.price,
        quantity: row.quantity,
      });
    });

    return NextResponse.json({
      success: true,
      orders: grouped,
      totalGuests: Object.keys(grouped).length,
      totalItems: (data || []).reduce((sum: number, r: any) => sum + r.quantity, 0),
    });
  } catch (err: any) {
    console.error('[share-order] GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
