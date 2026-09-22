CREATE OR REPLACE FUNCTION public.count_active_pro_accounts()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  WITH RECURSIVE active_emails AS (
    SELECT lower(btrim(u.email)) AS email
    FROM public.users AS u
    WHERE u.email IS NOT NULL
      AND (
        (u.is_pro IS TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > now()))
        OR (
          u.app_subscription_status IN ('active', 'grace_period', 'billing_issue')
          AND (u.app_subscription_expires_at IS NULL OR u.app_subscription_expires_at > now())
        )
        OR (u.activation_pro_expires_at IS NOT NULL AND u.activation_pro_expires_at > now())
      )
  ),
  email_edges AS (
    SELECT lower(btrim(l.app_email)) AS source_email,
           lower(btrim(l.purchase_email)) AS target_email
    FROM public.membership_email_links AS l
    UNION ALL
    SELECT lower(btrim(l.purchase_email)) AS source_email,
           lower(btrim(l.app_email)) AS target_email
    FROM public.membership_email_links AS l
  ),
  reachable(start_email, reached_email) AS (
    SELECT email, email
    FROM active_emails
    UNION
    SELECT r.start_email, e.target_email
    FROM reachable AS r
    JOIN email_edges AS e ON e.source_email = r.reached_email
  ),
  canonical_accounts AS (
    SELECT start_email, min(reached_email) AS account_key
    FROM reachable
    GROUP BY start_email
  )
  SELECT count(DISTINCT account_key)
  FROM canonical_accounts;
$function$;

REVOKE ALL ON FUNCTION public.count_active_pro_accounts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_active_pro_accounts() TO service_role;
