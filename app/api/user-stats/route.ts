import { NextResponse } from 'next/server';
import { getTotalUsers, getUserStats } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/user-stats
 * 取得用戶統計資料
 */
export async function GET() {
    try {
        const [totalUsers, countryStats] = await Promise.all([
            getTotalUsers(),
            getUserStats()
        ]);

        // 加入除錯資訊
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET';

        return NextResponse.json({
            success: true,
            totalUsers,
            targetUsers: 500,
            countryStats,
            debug: {
                supabaseUrl: supabaseUrl.substring(0, 30) + '...',
                timestamp: new Date().toISOString()
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch user stats' },
            { status: 500 }
        );
    }
}
