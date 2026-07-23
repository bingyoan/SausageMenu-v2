-- SausageMenu AI usage dashboard for Supabase.
-- Safe to run more than once in the Supabase SQL Editor.

ALTER TABLE public.app_ai_usage_requests
  ADD COLUMN IF NOT EXISTS client_platform TEXT NOT NULL DEFAULT 'unknown';

DO $$
BEGIN
  ALTER TABLE public.app_ai_usage_requests
    ADD CONSTRAINT app_ai_usage_client_platform_check
    CHECK (client_platform IN ('ios', 'android', 'web', 'unknown'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_app_ai_usage_platform_created
  ON public.app_ai_usage_requests(client_platform, created_at DESC);

-- Per-request detail with Taiwan-local timestamps.
CREATE OR REPLACE VIEW public.app_ai_usage_report AS
SELECT
  request_id,
  CASE client_platform
    WHEN 'ios' THEN 'iOS'
    WHEN 'android' THEN 'Android'
    WHEN 'web' THEN 'Web'
    ELSE 'Unknown'
  END AS platform,
  user_email,
  status,
  access_tier,
  usage_kind,
  page_count,
  model,
  prompt_tokens,
  output_tokens,
  thinking_tokens,
  total_tokens,
  estimated_cost_usd,
  estimated_cost_twd,
  created_at AT TIME ZONE 'Asia/Taipei' AS created_at_taipei,
  completed_at AT TIME ZONE 'Asia/Taipei' AS completed_at_taipei,
  usage_batch_id
FROM public.app_ai_usage_requests;

-- Platform subtotals plus a final TOTAL row. Values update automatically.
CREATE OR REPLACE VIEW public.app_ai_cost_summary AS
WITH completed AS (
  SELECT *
  FROM public.app_ai_usage_requests
  WHERE status = 'completed'
),
platform_totals AS (
  SELECT
    CASE client_platform
      WHEN 'ios' THEN 1
      WHEN 'android' THEN 2
      WHEN 'web' THEN 3
      ELSE 4
    END AS display_order,
    CASE client_platform
      WHEN 'ios' THEN 'iOS'
      WHEN 'android' THEN 'Android'
      WHEN 'web' THEN 'Web'
      ELSE 'Unknown'
    END AS platform,
    COUNT(*)::BIGINT AS request_count,
    COUNT(DISTINCT usage_batch_id)::BIGINT AS translation_count,
    COALESCE(SUM(page_count), 0)::BIGINT AS page_count,
    COALESCE(SUM(total_tokens), 0)::BIGINT AS total_tokens,
    ROUND(COALESCE(SUM(estimated_cost_usd), 0), 6) AS estimated_cost_usd,
    ROUND(COALESCE(SUM(estimated_cost_twd), 0), 4) AS estimated_cost_twd
  FROM completed
  GROUP BY client_platform
),
grand_total AS (
  SELECT
    99 AS display_order,
    'TOTAL'::TEXT AS platform,
    COUNT(*)::BIGINT AS request_count,
    COUNT(DISTINCT usage_batch_id)::BIGINT AS translation_count,
    COALESCE(SUM(page_count), 0)::BIGINT AS page_count,
    COALESCE(SUM(total_tokens), 0)::BIGINT AS total_tokens,
    ROUND(COALESCE(SUM(estimated_cost_usd), 0), 6) AS estimated_cost_usd,
    ROUND(COALESCE(SUM(estimated_cost_twd), 0), 4) AS estimated_cost_twd
  FROM completed
)
SELECT * FROM platform_totals
UNION ALL
SELECT * FROM grand_total
ORDER BY display_order;

REVOKE ALL ON public.app_ai_usage_report FROM anon, authenticated;
REVOKE ALL ON public.app_ai_cost_summary FROM anon, authenticated;
GRANT SELECT ON public.app_ai_usage_report TO service_role;
GRANT SELECT ON public.app_ai_cost_summary TO service_role;
