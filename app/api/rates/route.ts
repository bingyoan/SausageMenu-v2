import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rates
 * 取得最新全球匯率 (以 TWD 為基底)
 * 支援 160+ 種貨幣，資料來源: Exchangerate-API (每小時更新)
 */
export async function GET() {
    try {
        // 使用以 TWD 為基準的匯率 (1 TWD = x Foreign Currency)
        const res = await fetch('https://open.er-api.com/v6/latest/TWD', {
            next: { revalidate: 3600 } // 快取 1 小時
        });

        if (!res.ok) throw new Error('Failed to fetch from global rates API');

        const data = await res.json();
        const rates: Record<string, number> = { 'TWD': 1.0 };

        // 轉換為我們需要的格式: 1 Foreign Currency = x TWD
        if (data.rates) {
            Object.entries(data.rates).forEach(([code, rate]) => {
                const r = Number(rate);
                if (r > 0) {
                    rates[code.toUpperCase()] = 1 / r;
                }
            });
        }

        return NextResponse.json({
            success: true,
            rates,
            provider: 'exchangerate-api',
            base: 'TWD',
            timestamp: data.time_last_update_unix || Date.now()
        });

    } catch (err: any) {
        console.error("Rates API Error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
