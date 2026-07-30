import { getRequestSession } from '@/lib/authSession';
import {
  CREATOR_ATTRIBUTION_DAYS,
  isValidCreatorCode,
  loadAffiliateUser,
  normalizeCreatorCode,
  userAlreadySubscribed,
} from '@/lib/creatorAffiliate';
import { getSupabaseService } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  code: z.string().max(64),
  platform: z.enum(['ios', 'android']),
});

async function requireAccount(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) return { error: NextResponse.json({ error: 'Session expired' }, { status: 401 }) };
  const user = await loadAffiliateUser(session.email);
  if (!user?.revenuecat_app_user_id) {
    return { error: NextResponse.json({ error: 'Subscription account was not found' }, { status: 404 }) };
  }
  return { session, user };
}

export async function GET(request: NextRequest) {
  try {
    const account = await requireAccount(request);
    if ('error' in account) return account.error;

    const supabase = getSupabaseService();
    const { data, error } = await supabase
      .from('creator_attributions')
      .select('code, status, attributed_at, expires_at, converted_at, creators(display_name)')
      .eq('revenuecat_app_user_id', account.user.revenuecat_app_user_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ success: true, attribution: null });

    const expired = data.status === 'pending' && Date.parse(data.expires_at) <= Date.now();
    return NextResponse.json({
      success: true,
      attribution: {
        code: data.code,
        creatorName: (data.creators as any)?.display_name || 'Creator',
        status: expired ? 'expired' : data.status,
        attributedAt: data.attributed_at,
        expiresAt: data.expires_at,
        convertedAt: data.converted_at,
      },
    });
  } catch (error: any) {
    console.error('[creator-code/get]', error);
    return NextResponse.json({ error: 'Unable to load creator code' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const account = await requireAccount(request);
    if ('error' in account) return account.error;
    if (userAlreadySubscribed(account.user)) {
      return NextResponse.json({ error: 'Creator discounts are only available before the first subscription' }, { status: 409 });
    }

    const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid creator code request' }, { status: 400 });
    const code = normalizeCreatorCode(parsed.data.code);
    if (!isValidCreatorCode(code)) return NextResponse.json({ error: 'Invalid creator code' }, { status: 400 });

    const supabase = getSupabaseService();
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id, code, display_name, email, status')
      .eq('code', code)
      .eq('status', 'active')
      .maybeSingle();
    if (creatorError) throw new Error(creatorError.message);
    if (!creator) return NextResponse.json({ error: 'Creator code was not found' }, { status: 404 });
    if (creator.email && creator.email.toLowerCase().trim() === account.session.email) {
      return NextResponse.json({ error: 'Creators cannot redeem their own code' }, { status: 403 });
    }

    const { data: existing, error: existingError } = await supabase
      .from('creator_attributions')
      .select('id, status')
      .eq('revenuecat_app_user_id', account.user.revenuecat_app_user_id)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing?.status === 'converted') {
      return NextResponse.json({ error: 'The creator for this purchase is already locked' }, { status: 409 });
    }

    const attributedAt = new Date();
    const expiresAt = new Date(attributedAt.getTime() + CREATOR_ATTRIBUTION_DAYS * 86400000);
    const row = {
      revenuecat_app_user_id: account.user.revenuecat_app_user_id,
      creator_id: creator.id,
      code,
      platform: parsed.data.platform,
      status: 'pending',
      attributed_at: attributedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      converted_at: null,
      original_transaction_id: null,
    };
    const mutation = existing
      ? supabase.from('creator_attributions').update(row).eq('id', existing.id)
      : supabase.from('creator_attributions').insert(row);
    const { error: saveError } = await mutation;
    if (saveError) throw new Error(saveError.message);

    return NextResponse.json({
      success: true,
      eligible: true,
      code,
      creatorName: creator.display_name,
      expiresAt: expiresAt.toISOString(),
      discount: { percentage: 20, billingPeriods: 1, renewalPriceTwd: 2390 },
    });
  } catch (error: any) {
    console.error('[creator-code/post]', error);
    return NextResponse.json({ error: 'Unable to apply creator code' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const account = await requireAccount(request);
    if ('error' in account) return account.error;
    const supabase = getSupabaseService();
    const { data: existing, error } = await supabase
      .from('creator_attributions')
      .select('id, status')
      .eq('revenuecat_app_user_id', account.user.revenuecat_app_user_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!existing) return NextResponse.json({ success: true });
    if (existing.status === 'converted') {
      return NextResponse.json({ error: 'The creator for this purchase is already locked' }, { status: 409 });
    }
    const { error: deleteError } = await supabase.from('creator_attributions').delete().eq('id', existing.id);
    if (deleteError) throw new Error(deleteError.message);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[creator-code/delete]', error);
    return NextResponse.json({ error: 'Unable to remove creator code' }, { status: 500 });
  }
}
