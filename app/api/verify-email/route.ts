import { getRequestSession } from '@/lib/authSession';
import { getSupabaseService, incrementTotalUsers, incrementCountryStat } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function verifyGumroadLicense(params: {
  email: string;
  productId?: string;
  licenseKey?: string;
  saleId?: string;
}): Promise<boolean> {
  if (!params.productId || !params.licenseKey) return false;

  const form = new URLSearchParams({
    product_id: params.productId,
    license_key: params.licenseKey,
    increment_uses_count: 'false',
  });
  const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    cache: 'no-store',
  });
  if (!response.ok) return false;

  const result = await response.json().catch(() => null);
  const purchase = result?.purchase;
  if (!result?.success || !purchase) return false;

  const purchaseEmail = String(purchase.email || '').toLowerCase().trim();
  const sameSale = !params.saleId || purchase.sale_id === params.saleId || purchase.id === params.saleId;
  return purchaseEmail === params.email
    && sameSale
    && purchase.refunded !== true
    && purchase.disputed !== true
    && purchase.chargebacked !== true;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseService();

    // =================================================================
    // 🛡️ 這裡幫你修好了：同時支援舊網站 (JSON) 和 Gumroad (FormData)
    // =================================================================
    let body: any = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try { body = await request.json(); } catch (e) { }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      try {
        const formData = await request.formData();
        body = Object.fromEntries(formData);
      } catch (e) { }
    } else {
      // 如果沒 Header，嘗試讀純文字 (最後防線)
      try {
        const text = await request.text();
        body = JSON.parse(text);
      } catch { }
    }

    let { email, code, sale_id, product_id, product_permalink, license_key, country } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    email = email.toLowerCase().trim();
    if (code) code = code.trim().toUpperCase();

    const isGumroadWebhook = Boolean(sale_id || product_id);
    if (isGumroadWebhook) {
      // Gumroad Ping is accepted only when either its private URL secret is
      // valid or Gumroad's license API independently confirms this purchase.
      const expectedSecret = process.env.GUMROAD_WEBHOOK_SECRET?.trim();
      const providedSecret =
        request.headers.get('x-gumroad-webhook-secret')?.trim() ||
        request.nextUrl.searchParams.get('secret')?.trim();
      const hasValidSecret = Boolean(expectedSecret && providedSecret === expectedSecret);
      const hasVerifiedLicense = hasValidSecret
        ? false
        : await verifyGumroadLicense({
            email,
            productId: product_id,
            licenseKey: license_key,
            saleId: sale_id,
          });
      if (!hasValidSecret && !hasVerifiedLicense) {
        return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
      }

      const expectedProduct = process.env.GUMROAD_PRODUCT_PERMALINK?.trim() || 'ihrnvp';
      if (product_permalink && product_permalink !== expectedProduct) {
        return NextResponse.json({ error: 'Unexpected Gumroad product' }, { status: 400 });
      }
    } else if (!code) {
      // Membership lookup is account data. Only the verified signed-in owner
      // may query it; an arbitrary email address is not sufficient proof.
      const session = getRequestSession(request);
      if (!session || session.email !== email) {
        return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
      }
    }

    // =================================================================
    // 🟢 路徑 A：序號驗證 (已幫你修復重複的語法錯誤)
    // =================================================================
    if (code) {
      const GROUP_CODE = "SNOWFREE";

      if (code === GROUP_CODE) {
        console.log(`[API] 群組代碼驗證成功: ${email}`);

        // 設定 10 天試用
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 10);

        await supabase.from('users').upsert({
          email: email,
          is_pro: true,
          pro_expires_at: expiresAt.toISOString(),
          notes: '群組 10 天試用' // 修正：只保留這一行，移除重複錯誤
        }, { onConflict: 'email' });

        return NextResponse.json({
          verified: true,
          message: `群組試用已開通！有效期限至 ${expiresAt.toLocaleDateString()}`
        });
      }

      // 一般序號檢查 (舊系統)
      const { data: license } = await supabase
        .from('license_codes')
        .select('*').eq('code', code).eq('is_used', false).single();

      if (license) {
        await supabase.from('license_codes').update({ is_used: true, used_by_email: email }).eq('id', license.id);
        await supabase.from('users').upsert({ email: email, is_pro: true, is_counted: true }, { onConflict: 'email' });
        await incrementTotalUsers(); // 增加用戶計數
        if (country) await incrementCountryStat(country); // 增加國家計數
        return NextResponse.json({ verified: true, message: '序號開通成功' });
      }

      // 推薦碼檢查 (新系統)
      const { data: referral } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code)
        .eq('is_used', false)
        .not('assigned_to', 'is', null) // 必須是已經被購買(分配)出去的碼
        .single();

      if (referral) {
        // 標記推薦碼已被使用
        await supabase.from('referral_codes').update({
          is_used: true,
          used_by: email,
          used_at: new Date().toISOString()
        }).eq('id', referral.id);

        // 開通 PRO 權限
        await supabase.from('users').upsert({
          email: email,
          is_pro: true,
          is_counted: true
        }, { onConflict: 'email' });

        await incrementTotalUsers();
        if (country) await incrementCountryStat(country);

        return NextResponse.json({ verified: true, message: '推薦碼開通成功！' });
      }

      return NextResponse.json({ verified: false, message: '序號無效或已被使用' });
    }

    // =================================================================
    // 🟣 路徑 B：Gumroad Webhook 自動開通
    // =================================================================
    if (sale_id || product_id) {
      console.log(`[API] Gumroad 開通: ${email}`);

      // 先檢查用戶是否已經存在且已被計數
      const { data: existingUser } = await supabase
        .from('users')
        .select('is_counted')
        .eq('email', email)
        .single();

      const alreadyCounted = existingUser?.is_counted;

      const { error } = await supabase.from('users').upsert({
        email: email,
        is_pro: true,
        pro_expires_at: null,
        is_counted: true,
        notes: `Gumroad Purchase: ${sale_id}`
      }, { onConflict: 'email' });

      if (error) {
        console.error('[API] DB Error:', error);
        return NextResponse.json({ verified: false, error: 'DB Error' });
      }

      // 只有在尚未計數時才更新統計
      if (!alreadyCounted) {
        await incrementTotalUsers();
        if (country) {
          await incrementCountryStat(country);
          console.log(`[API] 統計更新: 總數+1, 國家=${country}`);
        }
      }
      return NextResponse.json({ verified: true });
    }

    // =================================================================
    // 🔵 路徑 C：檢查用戶狀態 (舊功能)
    // =================================================================
    const { data: user } = await supabase.from('users').select('is_pro, pro_expires_at, is_counted').eq('email', email).single();
    if (user && user.is_pro) {
      if (user.pro_expires_at && new Date() > new Date(user.pro_expires_at)) {
        return NextResponse.json({ verified: false, message: 'Expired' });
      }

      // 如果用戶是 Pro 且還沒被計算過，則在此刻執行 +1 邏輯
      if (!user.is_counted) {
        await incrementTotalUsers();
        if (country) await incrementCountryStat(country);
        // 更新標記，避免重複計數
        await supabase.from('users').update({ is_counted: true }).eq('email', email);
        console.log(`[API] 首名登入計數成功: ${email}`);
      }
      return NextResponse.json({ verified: true });
    }
    return NextResponse.json({ verified: false, message: 'No active license found.' });

  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
