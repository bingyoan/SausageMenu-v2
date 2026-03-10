import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const errors: string[] = [];
    const logs: string[] = [];

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl) errors.push('Missing NEXT_PUBLIC_SUPABASE_URL');
        if (!supabaseServiceKey) errors.push('Missing SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY');

        logs.push(`Using Service Key: ${supabaseServiceKey ? 'Yes (first 10 chars: ' + supabaseServiceKey.substring(0, 10) + '...)' : 'No'}`);

        if (errors.length > 0) {
            return NextResponse.json({ success: false, errors, logs }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

        // 1. 更新總人數為 40
        const { error: totalError } = await supabase.from('total_users').upsert({ id: 1, count: 40 });
        if (totalError) {
            errors.push(`total_users upsert failed: ${totalError.message} (code: ${totalError.code})`);
        } else {
            logs.push('total_users updated to 40');
        }

        // 2. 更新台灣統計為 38
        const { error: twError } = await supabase.from('user_stats').upsert({
            country_code: 'TW',
            country_name: '台灣',
            user_count: 38
        }, { onConflict: 'country_code' });
        if (twError) {
            errors.push(`user_stats TW upsert failed: ${twError.message} (code: ${twError.code})`);
        } else {
            logs.push('user_stats TW updated to 38');
        }

        // 3. 更新印尼統計為 1
        const { error: idError } = await supabase.from('user_stats').upsert({
            country_code: 'ID',
            country_name: '印尼',
            user_count: 1
        }, { onConflict: 'country_code' });
        if (idError) {
            errors.push(`user_stats ID upsert failed: ${idError.message} (code: ${idError.code})`);
        } else {
            logs.push('user_stats ID updated to 1');
        }

        // 4. 更新香港統計為 1
        const { error: hkError } = await supabase.from('user_stats').upsert({
            country_code: 'HK',
            country_name: '香港',
            user_count: 1
        }, { onConflict: 'country_code' });
        if (hkError) {
            errors.push(`user_stats HK upsert failed: ${hkError.message} (code: ${hkError.code})`);
        } else {
            logs.push('user_stats HK updated to 1');
        }

        return NextResponse.json({
            success: errors.length === 0,
            message: errors.length === 0 ? 'Database initialized with 40 users (38 TW, 1 ID, 1 HK)' : 'Partial failure',
            errors,
            logs
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message, errors, logs }, { status: 500 });
    }
}
