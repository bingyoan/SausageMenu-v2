import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/become-affiliate
 * 引導用戶至 Gumroad Affiliate 註冊頁面
 * 
 * 注意：Gumroad API 不支援自動建立 Affiliate，
 * 因此改為提供註冊連結讓用戶自行申請
 * 
 * Request Body: { email: string }
 * Response: { success: boolean, message: string, affiliateSignupUrl: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // 驗證 Email
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json(
                { success: false, message: 'Please provide a valid email address.' },
                { status: 400 }
            );
        }

        // Gumroad Product ID
        const productId = process.env.GUMROAD_PRODUCT_ID || 'ihrnvp';

        // Gumroad Affiliate 註冊連結
        // 用戶需要有 Gumroad 帳號才能成為 Affiliate
        const affiliateSignupUrl = `https://gumroad.com/affiliates/${productId}`;

        // 產品購買連結（帶 email 預填）
        const productUrl = `https://gumroad.com/l/${productId}?email=${encodeURIComponent(email)}`;

        return NextResponse.json({
            success: true,
            message: '🎉 感謝你的支持！請點擊下方連結申請成為推廣夥伴，即可獲得 30% 現金回饋！',
            affiliateSignupUrl: affiliateSignupUrl,
            productUrl: productUrl,
            email: email.toLowerCase().trim(),
        });

    } catch (error) {
        console.error('Affiliate API Error:', error);
        return NextResponse.json(
            { success: false, message: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
