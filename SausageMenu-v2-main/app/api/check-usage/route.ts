import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/check-usage
 * 檢查並更新用戶每日使用次數
 * 
 * 請求參數：
 * - email: 用戶 Email
 * - action: 'check' | 'increment' | 'reset'
 */
export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body = await request.json();
        const { email, action = 'check' } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // 查詢用戶資料
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('is_pro, pro_expires_at, daily_usage_count, last_usage_date, subscription_status')
            .eq('email', normalizedEmail)
            .single();

        // 用戶不存在，創建新用戶
        if (userError || !user) {
            if (action === 'increment') {
                await supabase.from('users').upsert({
                    email: normalizedEmail,
                    is_pro: false,
                    daily_usage_count: 1,
                    last_usage_date: today,
                    subscription_status: 'free'
                }, { onConflict: 'email' });

                return NextResponse.json({
                    success: true,
                    usageCount: 1,
                    remainingUses: 1, // 2 - 1
                    isPro: false,
                    dailyLimit: 2
                });
            }

            return NextResponse.json({
                success: true,
                usageCount: 0,
                remainingUses: 2,
                isPro: false,
                dailyLimit: 2
            });
        }

        // 檢查是否為 PRO 用戶
        const isPro = user.is_pro && (!user.pro_expires_at || new Date(user.pro_expires_at) > new Date());
        const isSubscribed = user.subscription_status === 'active';

        // PRO 或訂閱用戶：無限次數
        if (isPro || isSubscribed) {
            return NextResponse.json({
                success: true,
                usageCount: 0,
                remainingUses: Infinity,
                isPro: true,
                dailyLimit: Infinity
            });
        }

        // 免費用戶：檢查每日使用次數
        let currentCount = user.daily_usage_count || 0;
        const lastUsageDate = user.last_usage_date;

        // 如果是新的一天，重置計數
        if (lastUsageDate !== today) {
            currentCount = 0;
        }

        // 執行操作
        if (action === 'increment') {
            const newCount = currentCount + 1;

            await supabase
                .from('users')
                .update({
                    daily_usage_count: newCount,
                    last_usage_date: today
                })
                .eq('email', normalizedEmail);

            return NextResponse.json({
                success: true,
                usageCount: newCount,
                remainingUses: Math.max(0, 2 - newCount),
                isPro: false,
                dailyLimit: 2
            });
        }

        if (action === 'reset') {
            await supabase
                .from('users')
                .update({
                    daily_usage_count: 0,
                    last_usage_date: today
                })
                .eq('email', normalizedEmail);

            return NextResponse.json({
                success: true,
                usageCount: 0,
                remainingUses: 2,
                isPro: false,
                dailyLimit: 2
            });
        }

        // 預設：只檢查
        return NextResponse.json({
            success: true,
            usageCount: currentCount,
            remainingUses: Math.max(0, 2 - currentCount),
            isPro: false,
            dailyLimit: 2
        });

    } catch (err: any) {
        console.error('[check-usage] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
