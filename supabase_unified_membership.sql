-- Unify legacy web membership and RevenueCat app membership for AI quotas.
-- Existing purchase-source fields remain separate; either active source grants PRO.

CREATE TABLE IF NOT EXISTS public.membership_email_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_email TEXT NOT NULL UNIQUE REFERENCES public.users(email) ON DELETE CASCADE,
  purchase_email TEXT NOT NULL UNIQUE REFERENCES public.users(email) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (app_email = LOWER(TRIM(app_email))),
  CHECK (purchase_email = LOWER(TRIM(purchase_email))),
  CHECK (app_email <> purchase_email)
);
ALTER TABLE public.membership_email_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.membership_email_links FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.membership_email_links TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_app_ai_usage(
  p_email TEXT,
  p_request_id UUID,
  p_usage_batch_id UUID,
  p_usage_kind TEXT,
  p_page_count INTEGER,
  p_global_daily_page_limit INTEGER DEFAULT 5000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_today DATE := CURRENT_DATE;
  v_month TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  v_paid BOOLEAN;
  v_global_pages BIGINT;
  v_existing public.app_ai_usage_requests%ROWTYPE;
  v_counts_quota BOOLEAN;
BEGIN
  IF p_page_count < 1 OR p_page_count > 4 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'single_request_limit', 'singleRequestLimit', 4);
  END IF;
  IF p_usage_kind NOT IN ('menu', 'explain') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_usage_kind');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('sausage_menu_ai_daily_budget'));

  UPDATE public.app_ai_usage_requests
  SET response_json = NULL
  WHERE response_json IS NOT NULL AND created_at < NOW() - INTERVAL '1 day';

  SELECT * INTO v_existing
  FROM public.app_ai_usage_requests
  WHERE request_id = p_request_id;

  IF FOUND AND v_existing.status IN ('reserved', 'completed') THEN
    RETURN jsonb_build_object('allowed', true, 'duplicate', true, 'tier', v_existing.access_tier);
  ELSIF FOUND THEN
    DELETE FROM public.app_ai_usage_requests WHERE request_id = p_request_id;
  END IF;

  SELECT COALESCE(SUM(page_count), 0) INTO v_global_pages
  FROM public.app_ai_usage_requests
  WHERE created_at >= DATE_TRUNC('day', NOW())
    AND status IN ('reserved', 'completed');

  IF v_global_pages + p_page_count > p_global_daily_page_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'service_daily_budget');
  END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE email = LOWER(TRIM(p_email))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'account_not_found');
  END IF;

  v_paid := (
      v_user.is_pro IS TRUE
      AND (v_user.pro_expires_at IS NULL OR v_user.pro_expires_at > NOW())
    ) OR (
      v_user.app_subscription_status IN ('active', 'grace_period', 'billing_issue')
      AND (v_user.app_subscription_expires_at IS NULL OR v_user.app_subscription_expires_at > NOW())
    ) OR (
      v_user.activation_pro_expires_at IS NOT NULL
      AND v_user.activation_pro_expires_at > NOW()
    ) OR EXISTS (
      SELECT 1
      FROM public.membership_email_links link
      JOIN public.users source_user ON source_user.email = link.purchase_email
      WHERE link.app_email = v_user.email
        AND source_user.is_pro IS TRUE
        AND (source_user.pro_expires_at IS NULL OR source_user.pro_expires_at > NOW())
    );

  IF v_user.last_usage_date IS DISTINCT FROM v_today THEN
    v_user.daily_usage_count := 0;
  END IF;
  IF v_user.usage_month IS DISTINCT FROM v_month THEN
    v_user.monthly_usage_count := 0;
  END IF;

  v_counts_quota := p_usage_kind = 'menu' AND NOT EXISTS (
    SELECT 1
    FROM public.app_ai_usage_requests
    WHERE usage_batch_id = p_usage_batch_id
      AND quota_counted = TRUE
      AND status IN ('reserved', 'completed')
  );

  IF v_paid THEN
    IF v_counts_quota AND v_user.daily_usage_count + 1 > 20 THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'paid_daily_limit', 'dailyLimit', 20);
    END IF;
    IF v_counts_quota AND v_user.monthly_usage_count + 1 > 60 THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'paid_monthly_limit', 'monthlyLimit', 60);
    END IF;

    UPDATE public.users SET
      daily_usage_count = v_user.daily_usage_count + CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
      monthly_usage_count = v_user.monthly_usage_count + CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
      last_usage_date = v_today,
      usage_month = v_month
    WHERE email = v_user.email;

    INSERT INTO public.app_ai_usage_requests(
      request_id, user_email, page_count, access_tier,
      usage_batch_id, usage_kind, quota_counted
    ) VALUES (
      p_request_id, v_user.email, p_page_count, 'paid',
      p_usage_batch_id, p_usage_kind, v_counts_quota
    );

    RETURN jsonb_build_object(
      'allowed', true,
      'tier', 'paid',
      'quotaCounted', v_counts_quota,
      'dailyUsed', v_user.daily_usage_count + CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
      'dailyRemaining', 20 - v_user.daily_usage_count - CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
      'monthlyUsed', v_user.monthly_usage_count + CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
      'monthlyRemaining', 60 - v_user.monthly_usage_count - CASE WHEN v_counts_quota THEN 1 ELSE 0 END
    );
  END IF;

  IF v_counts_quota AND v_user.free_lifetime_pages_used + 1 > 3 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'free_lifetime_limit', 'lifetimeLimit', 3);
  END IF;

  UPDATE public.users SET
    free_lifetime_pages_used = v_user.free_lifetime_pages_used + CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
    daily_usage_count = v_user.daily_usage_count + CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
    last_usage_date = v_today
  WHERE email = v_user.email;

  INSERT INTO public.app_ai_usage_requests(
    request_id, user_email, page_count, access_tier,
    usage_batch_id, usage_kind, quota_counted
  ) VALUES (
    p_request_id, v_user.email, p_page_count, 'free',
    p_usage_batch_id, p_usage_kind, v_counts_quota
  );

  RETURN jsonb_build_object(
    'allowed', true,
    'tier', 'free',
    'quotaCounted', v_counts_quota,
    'lifetimeUsed', v_user.free_lifetime_pages_used + CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
    'lifetimeRemaining', 3 - v_user.free_lifetime_pages_used - CASE WHEN v_counts_quota THEN 1 ELSE 0 END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.release_app_ai_usage(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.app_ai_usage_requests%ROWTYPE;
  v_user public.users%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM public.app_ai_usage_requests
  WHERE request_id = p_request_id
  FOR UPDATE;
  IF NOT FOUND OR v_request.status <> 'reserved' THEN RETURN; END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE email = v_request.user_email
  FOR UPDATE;

  IF v_request.quota_counted AND v_request.access_tier = 'paid' THEN
    UPDATE public.users SET
      daily_usage_count = GREATEST(0, daily_usage_count - 1),
      monthly_usage_count = GREATEST(0, monthly_usage_count - 1)
    WHERE email = v_request.user_email;
  ELSIF v_request.quota_counted THEN
    UPDATE public.users SET
      daily_usage_count = GREATEST(0, daily_usage_count - 1),
      free_lifetime_pages_used = GREATEST(0, free_lifetime_pages_used - 1)
    WHERE email = v_request.user_email;
  END IF;

  UPDATE public.app_ai_usage_requests SET
    status = 'failed',
    quota_counted = FALSE,
    completed_at = NOW()
  WHERE request_id = p_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_app_ai_usage(
  p_request_id UUID,
  p_model TEXT,
  p_prompt_tokens INTEGER,
  p_output_tokens INTEGER,
  p_thinking_tokens INTEGER,
  p_total_tokens INTEGER,
  p_estimated_cost_usd NUMERIC,
  p_response_json JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.app_ai_usage_requests SET
    status = 'completed',
    model = p_model,
    prompt_tokens = p_prompt_tokens,
    output_tokens = p_output_tokens,
    thinking_tokens = p_thinking_tokens,
    total_tokens = p_total_tokens,
    estimated_cost_usd = p_estimated_cost_usd,
    response_json = p_response_json,
    completed_at = NOW()
  WHERE request_id = p_request_id AND status = 'reserved';
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_app_ai_usage(TEXT, UUID, UUID, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_app_ai_usage(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_app_ai_usage(UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, NUMERIC, JSONB)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_app_ai_usage(TEXT, UUID, UUID, TEXT, INTEGER, INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.release_app_ai_usage(UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_app_ai_usage(UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, NUMERIC, JSONB)
  TO service_role;
