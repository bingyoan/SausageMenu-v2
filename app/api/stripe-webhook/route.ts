import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseService } from '@/lib/supabase';
import { Resend } from 'resend';

/**
 * POST /api/stripe-webhook
 * 處理 Stripe Webhook（付款成功後發送推薦碼）
 */
export async function POST(request: NextRequest) {
    // 檢查環境變數
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey || !webhookSecret) {
        console.error('[Webhook] Stripe environment variables not configured');
        return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);

    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
        console.error('[Webhook] Missing signature');
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.error('[Webhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[Webhook] 收到事件: ${event.type}`);

    // 處理 checkout.session.completed 事件
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Webhook] checkout.session.completed:', session.id);

        if (session.metadata?.type === 'referral_code_purchase') {
            const email = session.metadata.email || session.customer_email;
            if (email) {
                try {
                    const code = await handleReferralCodePurchase(email);
                    console.log(`[Webhook] 推薦碼已分配並發送: ${code} -> ${email}`);
                } catch (error) {
                    console.error('[Webhook] 發送推薦碼失敗:', error);
                }
            }
        }
    }

    // 處理 payment_intent.succeeded 事件
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[Webhook] payment_intent.succeeded:', paymentIntent.id);

        // 從 payment_intent 取得相關的 checkout session
        if (paymentIntent.metadata?.type === 'referral_code_purchase') {
            const email = paymentIntent.metadata.email || paymentIntent.receipt_email;
            if (email) {
                try {
                    const code = await handleReferralCodePurchase(email);
                    console.log(`[Webhook] 推薦碼已分配並發送: ${code} -> ${email}`);
                } catch (error) {
                    console.error('[Webhook] 發送推薦碼失敗:', error);
                }
            }
        } else {
            // 直接用 receipt_email 作為備用方案
            const email = paymentIntent.receipt_email;
            if (email) {
                console.log('[Webhook] 使用 receipt_email:', email);
                try {
                    const code = await handleReferralCodePurchase(email);
                    console.log(`[Webhook] 推薦碼已分配並發送: ${code} -> ${email}`);
                } catch (error) {
                    console.error('[Webhook] 發送推薦碼失敗:', error);
                }
            } else {
                console.log('[Webhook] 無法取得 email，跳過處理');
            }
        }
    }

    return NextResponse.json({ received: true });
}

/**
 * 處理推薦碼購買：從資料庫取出未使用的 CODE 並發送 Email 給用戶
 */
async function handleReferralCodePurchase(email: string): Promise<string> {
    const supabase = getSupabaseService();
    
    console.log(`[Webhook] 開始處理推薦碼分配，Email: ${email}`);

    // 1. 檢查是否已經分配過（避免重複）
    const { data: existingCode } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('assigned_to', email)
        .single();

    if (existingCode) {
        console.log(`[Webhook] 此 Email 已有推薦碼: ${existingCode.code}，重新發送通知`);
        await sendAdminNotification(email, existingCode.code);
        return existingCode.code;
    }

    // 2. 取得一個未使用的推薦碼
    const { data: codeData, error: fetchError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('is_used', false)
        .is('assigned_to', null)
        .limit(1)
        .single();

    if (fetchError || !codeData) {
        console.error('[Webhook] 沒有可用的推薦碼:', fetchError);
        throw new Error('沒有可用的推薦碼，請聯繫管理員');
    }

    // 3. 標記此 CODE 已分配
    const { error: updateError } = await supabase
        .from('referral_codes')
        .update({
            assigned_to: email,
            assigned_at: new Date().toISOString(),
        })
        .eq('id', codeData.id);

    if (updateError) {
        console.error('[Webhook] 更新推薦碼狀態失敗:', updateError);
        throw new Error('更新推薦碼狀態失敗');
    }

    // 4. 發送通知 Email 給管理員（因為 Resend 免費版只能寄給自己）
    await sendAdminNotification(email, codeData.code);

    console.log(`[Webhook] ✅ 推薦碼已成功分配: ${codeData.code} -> ${email}`);

    return codeData.code;
}

/**
 * 發送通知 Email 給管理員（購買者資訊 + 推薦碼）
 */
async function sendAdminNotification(customerEmail: string, code: string): Promise<void> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || 'bingyoan@gmail.com';

    if (!resendApiKey) {
        console.error('[Email] RESEND_API_KEY not configured');
        throw new Error('Email service not configured');
    }

    const resend = new Resend(resendApiKey);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Sausage Menu Pal <onboarding@resend.dev>',
            to: adminEmail,
            subject: `🔔 新推薦碼購買：${customerEmail}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 500px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; background: #f0fdf4; border-radius: 12px; margin-bottom: 20px; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 15px 0; }
        .code-box { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 25px; border-radius: 16px; text-align: center; margin: 20px 0; }
        .code { font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 10px 0; }
        .action-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; color: #16a34a;">💰 新的推薦碼購買！</h1>
        </div>
        
        <div class="info-box">
            <p style="margin: 0 0 10px 0;"><strong>購買者 Email：</strong></p>
            <p style="margin: 0; font-size: 18px; color: #3b82f6;">${customerEmail}</p>
        </div>
        
        <div class="code-box">
            <p style="margin: 0 0 5px 0; font-size: 14px;">分配的推薦碼</p>
            <div class="code">${code}</div>
        </div>
        
        <div class="action-box">
            <p style="margin: 0;"><strong>📧 下一步：</strong></p>
            <p style="margin: 5px 0 0 0;">請將以下訊息轉發給購買者：</p>
            <hr style="border: none; border-top: 1px dashed #f59e0b; margin: 10px 0;">
            <p style="margin: 0; font-size: 14px;">
                <em>
                你好！感謝你購買 Sausage Menu Pal 推薦碼！<br><br>
                你的推薦碼是：<strong>${code}</strong><br><br>
                你可以把這組推薦碼以 NT$200 賣給朋友，賺取 NT$80 的利潤！<br><br>
                朋友只要在 App 的驗證畫面輸入這組推薦碼，就可以永久開通 PRO 功能！
                </em>
            </p>
        </div>
        
        <p style="text-align: center; color: #888; font-size: 12px;">
            此 Email 已自動發送給管理員
        </p>
    </div>
</body>
</html>
            `,
        });

        if (error) {
            console.error('[Email] 發送通知失敗:', error);
            throw error;
        }

        console.log(`[Email] ✅ 管理員通知發送成功, ID: ${data?.id}`);
    } catch (error) {
        console.error('[Email] 發送通知 Email 時發生錯誤:', error);
        throw error;
    }
}

