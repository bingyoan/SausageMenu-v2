import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET: Retrieve a single cached menu and increment view count
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('cached_menus')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Menu not found' }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    supabase
      .from('cached_menus')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id)
      .then(() => {});

    return NextResponse.json({ success: true, menu: data });
  } catch (err: any) {
    console.error('Menu cache GET [id] error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
