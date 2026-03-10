import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * POST /api/create-checkout
 * 創建 Stripe Checkout Session 來購買推薦碼
 */
export async function POST(request: NextRequest) {
    try {
        // 檢查環境變數
        const secretKey = process.env.STRIPE_SECRET_KEY;
        const priceId = process.env.STRIPE_PRICE_ID;

        if (!secretKey) {
            return NextResponse.json(
                { success: false, message: 'Stripe 尚未設定，請聯繫管理員' },
                { status: 500 }
            );
        }

        if (!priceId) {
            return NextResponse.json(
                { success: false, message: '產品價格尚未設定，請聯繫管理員' },
                { status: 500 }
            );
        }

        const stripe = new Stripe(secretKey);

        const body = await request.json();
        const { email } = body;

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { success: false, message: '請提供有效的 Email' },
                { status: 400 }
            );
        }

        // 創建 Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://sausagemenu.zeabur.app'}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://sausagemenu.zeabur.app'}/?canceled=true`,
            metadata: {
                email: email.toLowerCase().trim(),
                type: 'referral_code_purchase',
            },
            // 把 metadata 也傳到 payment_intent
            payment_intent_data: {
                metadata: {
                    email: email.toLowerCase().trim(),
                    type: 'referral_code_purchase',
                },
                receipt_email: email.toLowerCase().trim(),
            },
        });

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            url: session.url,
        });

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || '創建付款連結失敗' },
            { status: 500 }
        );
    }
}
