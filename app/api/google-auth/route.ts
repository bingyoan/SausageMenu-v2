import { getSupabaseService } from '@/lib/supabase';
import { getRevenueCatAppUserId } from '@/lib/subscriptionUser';
import {
    issueSessionToken,
    verifyAppleIdentity,
    verifyGoogleIdentity,
    verifySessionToken,
} from '@/lib/authSession';
import { getRevenueCatProStatus } from '@/lib/revenueCatServer';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/google-auth
 * 處理 Google 登入並驗證訂閱狀態
 * 
 * 這個 API 接收 Google ID Token，驗證後：
 * 1. 檢查用戶是否已存在
 * 2. 如果存在，返回用戶的訂閱狀態
 * 3. 如果不存在，創建新的免費用戶
 */
export async function POST(request: Request) {
    try {
        const supabase = getSupabaseService();

        const body = await request.json();
        const { provider, idToken, accessToken, identityToken, sessionToken, displayName, photoUrl } = body;
        const identity = sessionToken
            ? await verifySessionToken(sessionToken)
            : provider === 'apple'
                ? await verifyAppleIdentity(identityToken || '')
                : await verifyGoogleIdentity(idToken, accessToken);
        const normalizedEmail = identity.email;
        const providerId = identity.subject;
        const nextSessionToken = await issueSessionToken(normalizedEmail, providerId);
        const today = new Date().toISOString().split('T')[0];

        // 查詢用戶是否已存在
        const { data: existingUser, error: queryError } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .single();

        if (existingUser) {
            const revenueCatAppUserId = getRevenueCatAppUserId(normalizedEmail);
            let subscriptionStatus = existingUser.subscription_status || 'free';
            let subscriptionExpiresAt: string | null = null;
            try {
                const revenueCat = await getRevenueCatProStatus(revenueCatAppUserId);
                subscriptionStatus = revenueCat.active ? 'active' : 'expired';
                subscriptionExpiresAt = revenueCat.expiresAt;
            } catch (error) {
                console.warn('[google-auth] RevenueCat sync skipped:', error);
            }

            // 用戶已存在，更新 Google 資訊並返回訂閱狀態
            const isPro = existingUser.is_pro &&
                (!existingUser.pro_expires_at || new Date(existingUser.pro_expires_at) > new Date());

            const isSubscribed = subscriptionStatus === 'active';

            // 檢查今日使用次數
            let dailyUsage = existingUser.daily_usage_count || 0;
            if (existingUser.last_usage_date !== today) {
                dailyUsage = 0; // 新的一天，重置
            }

            // 更新 Google 資訊
            await supabase
                .from('users')
                .update({
                    google_id: providerId || existingUser.google_id,
                    display_name: displayName || existingUser.display_name,
                    photo_url: photoUrl || existingUser.photo_url,
                    last_login_at: new Date().toISOString(),
                    subscription_status: subscriptionStatus
                })
                .eq('email', normalizedEmail);

            return NextResponse.json({
                success: true,
                isNewUser: false,
                user: {
                    email: normalizedEmail,
                    displayName: displayName || existingUser.display_name,
                    photoUrl: photoUrl || existingUser.photo_url,
                    isPro: isPro || isSubscribed,
                    subscriptionStatus,
                    subscriptionExpiresAt,
                    dailyUsageCount: dailyUsage,
                    remainingUses: (isPro || isSubscribed) ? Infinity : Math.max(0, 2 - dailyUsage),
                    revenueCatAppUserId,
                    sessionToken: nextSessionToken
                }
            });
        }

        // 用戶不存在，創建新用戶
        const revenueCatAppUserId = getRevenueCatAppUserId(normalizedEmail);
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                email: normalizedEmail,
                google_id: providerId,
                display_name: displayName,
                photo_url: photoUrl,
                is_pro: false,
                subscription_status: 'free',
                daily_usage_count: 0,
                last_usage_date: today,
                created_at: new Date().toISOString(),
                last_login_at: new Date().toISOString()
            });

        if (insertError) {
            console.error('[google-auth] Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            isNewUser: true,
            user: {
                email: normalizedEmail,
                displayName: displayName,
                photoUrl: photoUrl,
                isPro: false,
                subscriptionStatus: 'free',
                subscriptionExpiresAt: null,
                dailyUsageCount: 0,
                remainingUses: 2,
                revenueCatAppUserId,
                sessionToken: nextSessionToken
            }
        });

    } catch (err: any) {
        console.error('[google-auth] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
