import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body = await request.json();
        let { gumroadEmail, currentGoogleEmail } = body;

        if (!gumroadEmail || !currentGoogleEmail) {
            return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        gumroadEmail = gumroadEmail.toLowerCase().trim();
        currentGoogleEmail = currentGoogleEmail.toLowerCase().trim();

        // 檢查舊的 Gumroad Email 是否為 PRO 用戶
        const { data: user, error } = await supabase
            .from('users')
            .select('is_pro, pro_expires_at')
            .eq('email', gumroadEmail)
            .single();

        if (error || !user || !user.is_pro) {
            return NextResponse.json({ success: false, message: '未找到此 Email 的有效購買紀錄' }, { status: 404 });
        }

        // 把當前登入的 Google Email 也升級為 PRO，並留下記錄
        const { error: updateError } = await supabase
            .from('users')
            .upsert({
                email: currentGoogleEmail,
                is_pro: true,
                pro_expires_at: user.pro_expires_at,  // 繼承原本的過期時間（如果是永久就是 null）
                notes: `Restored from Gumroad: ${gumroadEmail}`
            }, { onConflict: 'email' });

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, message: '恢復購買成功！' });

    } catch (err: any) {
        console.error('Restore Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
