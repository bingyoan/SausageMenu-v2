-- SausageMenu managed-key subscriptions and atomic AI usage quotas.
-- Safe to run more than once in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_usage_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_usage_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_lifetime_pages_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_usage_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS usage_month TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN IF NOT EXISTS revenuecat_app_user_id UUID DEFAULT gen_random_uuid();
UPDATE users SET revenuecat_app_user_id = gen_random_uuid() WHERE revenuecat_app_user_id IS NULL;
ALTER TABLE users ALTER COLUMN revenuecat_app_user_id SET DEFAULT gen_random_uuid();
ALTER TABLE users ALTER COLUMN revenuecat_app_user_id SET NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS app_subscription_status TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS app_subscription_product_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS app_subscription_platform TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS app_subscription_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS app_subscription_updated_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_revenuecat_app_user_id ON users(revenuecat_app_user_id);
CREATE INDEX IF NOT EXISTS idx_users_app_subscription_status ON users(app_subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_last_usage_date ON users(last_usage_date);

CREATE TABLE IF NOT EXISTS app_ai_usage_requests (
  request_id UUID PRIMARY KEY,
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  page_count INTEGER NOT NULL CHECK (page_count BETWEEN 1 AND 4),
  access_tier TEXT NOT NULL CHECK (access_tier IN ('free', 'paid')),
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'completed', 'failed')),
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  prompt_tokens INTEGER,
  output_tokens INTEGER,
  thinking_tokens INTEGER,
  total_tokens INTEGER,
  estimated_cost_usd NUMERIC(12, 6),
  response_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_app_ai_usage_email_created
  ON app_ai_usage_requests(user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_ai_usage_created
  ON app_ai_usage_requests(created_at DESC);

ALTER TABLE app_ai_usage_requests ADD COLUMN IF NOT EXISTS response_json JSONB;
-- Convenience accounting column. USD remains the source-of-truth amount;
-- TWD uses a stable planning rate of NT$32.5 per USD for easy dashboard review.
ALTER TABLE app_ai_usage_requests ADD COLUMN IF NOT EXISTS estimated_cost_twd NUMERIC(12, 4)
  GENERATED ALWAYS AS (ROUND(estimated_cost_usd * 32.5, 4)) STORED;
ALTER TABLE app_ai_usage_requests ADD COLUMN IF NOT EXISTS usage_batch_id UUID;
ALTER TABLE app_ai_usage_requests ADD COLUMN IF NOT EXISTS usage_kind TEXT NOT NULL DEFAULT 'menu';
ALTER TABLE app_ai_usage_requests ADD COLUMN IF NOT EXISTS quota_counted BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE app_ai_usage_requests SET usage_batch_id = request_id WHERE usage_batch_id IS NULL;
ALTER TABLE app_ai_usage_requests ALTER COLUMN usage_batch_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_ai_usage_batch
  ON app_ai_usage_requests(usage_batch_id);

ALTER TABLE app_ai_usage_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_ai_usage_requests FROM anon, authenticated;

DROP FUNCTION IF EXISTS reserve_app_ai_usage(TEXT, UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION reserve_app_ai_usage(
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
SET search_path = public
AS $$
DECLARE
  v_user users%ROWTYPE;
  v_today DATE := CURRENT_DATE;
  v_month TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  v_paid BOOLEAN;
  v_global_pages BIGINT;
  v_existing app_ai_usage_requests%ROWTYPE;
  v_counts_quota BOOLEAN;
BEGIN
  IF p_page_count < 1 OR p_page_count > 4 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'single_request_limit', 'singleRequestLimit', 4);
  END IF;
  IF p_usage_kind NOT IN ('menu', 'explain') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_usage_kind');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('sausage_menu_ai_daily_budget'));

  -- Keep token/cost audit rows, but discard large cached response bodies after
  -- one day. This bounds database storage while preserving retry safety.
  UPDATE app_ai_usage_requests
  SET response_json = NULL
  WHERE response_json IS NOT NULL AND created_at < NOW() - INTERVAL '1 day';

  SELECT * INTO v_existing FROM app_ai_usage_requests WHERE request_id = p_request_id;
  IF FOUND AND v_existing.status IN ('reserved', 'completed') THEN
    RETURN jsonb_build_object('allowed', true, 'duplicate', true, 'tier', v_existing.access_tier);
  ELSIF FOUND THEN
    DELETE FROM app_ai_usage_requests WHERE request_id = p_request_id;
  END IF;

  SELECT COALESCE(SUM(page_count), 0) INTO v_global_pages
  FROM app_ai_usage_requests
  WHERE created_at >= DATE_TRUNC('day', NOW()) AND status IN ('reserved', 'completed');

  IF v_global_pages + p_page_count > p_global_daily_page_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'service_daily_budget');
  END IF;

  SELECT * INTO v_user FROM users WHERE email = LOWER(TRIM(p_email)) FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'account_not_found');
  END IF;

  v_paid := v_user.app_subscription_status IN ('active', 'grace_period', 'billing_issue')
    AND (v_user.app_subscription_expires_at IS NULL OR v_user.app_subscription_expires_at > NOW());

  IF v_user.last_usage_date IS DISTINCT FROM v_today THEN
    v_user.daily_usage_count := 0;
  END IF;
  IF v_user.usage_month IS DISTINCT FROM v_month THEN
    v_user.monthly_usage_count := 0;
  END IF;

  -- A multi-page upload creates one audit row per Gemini request, but the
  -- whole upload batch consumes only one translation from the user's quota.
  -- Explanation requests remain auditable without consuming translation quota.
  v_counts_quota := p_usage_kind = 'menu' AND NOT EXISTS (
    SELECT 1
    FROM app_ai_usage_requests
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

    UPDATE users SET
      daily_usage_count = v_user.daily_usage_count + CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
      monthly_usage_count = v_user.monthly_usage_count + CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
      last_usage_date = v_today,
      usage_month = v_month
    WHERE email = v_user.email;

    INSERT INTO app_ai_usage_requests(
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

  UPDATE users SET
    free_lifetime_pages_used = v_user.free_lifetime_pages_used + CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
    daily_usage_count = v_user.daily_usage_count + CASE WHEN v_counts_quota THEN 1 ELSE 0 END,
    last_usage_date = v_today
  WHERE email = v_user.email;

  INSERT INTO app_ai_usage_requests(
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

CREATE OR REPLACE FUNCTION release_app_ai_usage(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request app_ai_usage_requests%ROWTYPE;
  v_user users%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM app_ai_usage_requests
  WHERE request_id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.status <> 'reserved' THEN RETURN; END IF;

  SELECT * INTO v_user FROM users WHERE email = v_request.user_email FOR UPDATE;
  IF v_request.quota_counted AND v_request.access_tier = 'paid' THEN
    UPDATE users SET
      daily_usage_count = GREATEST(0, daily_usage_count - 1),
      monthly_usage_count = GREATEST(0, monthly_usage_count - 1)
    WHERE email = v_request.user_email;
  ELSIF v_request.quota_counted THEN
    UPDATE users SET
      daily_usage_count = GREATEST(0, daily_usage_count - 1),
      free_lifetime_pages_used = GREATEST(0, free_lifetime_pages_used - 1)
    WHERE email = v_request.user_email;
  END IF;

  UPDATE app_ai_usage_requests SET
    status = 'failed',
    quota_counted = FALSE,
    completed_at = NOW()
  WHERE request_id = p_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION complete_app_ai_usage(
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
SET search_path = public
AS $$
BEGIN
  UPDATE app_ai_usage_requests SET
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

REVOKE ALL ON FUNCTION reserve_app_ai_usage(TEXT, UUID, UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION release_app_ai_usage(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION complete_app_ai_usage(UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, NUMERIC, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_app_ai_usage(TEXT, UUID, UUID, TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION release_app_ai_usage(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION complete_app_ai_usage(UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, NUMERIC, JSONB) TO service_role;
