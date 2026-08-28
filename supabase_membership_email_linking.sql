-- Securely link a legacy web-purchase email to the currently signed-in app account.
-- Safe to run more than once. All data and functions are service-role only.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.membership_email_link_requests (
  id UUID PRIMARY KEY,
  app_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  purchase_email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'expired', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 5),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  CHECK (app_email = LOWER(TRIM(app_email))),
  CHECK (purchase_email = LOWER(TRIM(purchase_email)))
);

CREATE INDEX IF NOT EXISTS idx_membership_link_requests_app_created
  ON public.membership_email_link_requests(app_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_membership_link_requests_purchase_created
  ON public.membership_email_link_requests(purchase_email, created_at DESC);

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

ALTER TABLE public.membership_email_link_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_email_links ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.membership_email_link_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.membership_email_links FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.membership_email_link_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.membership_email_links TO service_role;

CREATE OR REPLACE FUNCTION public.create_membership_email_link_request(
  p_request_id UUID,
  p_app_email TEXT,
  p_purchase_email TEXT,
  p_code_hash TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_app_email TEXT := LOWER(TRIM(p_app_email));
  v_purchase_email TEXT := LOWER(TRIM(p_purchase_email));
  v_send_email BOOLEAN := FALSE;
BEGIN
  IF p_expires_at <= NOW() OR p_expires_at > NOW() + INTERVAL '15 minutes' THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'invalid_expiry');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = v_app_email) THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'account_not_found');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('membership-email-link:' || v_app_email));

  UPDATE public.membership_email_link_requests
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at <= NOW();

  DELETE FROM public.membership_email_link_requests
  WHERE created_at < NOW() - INTERVAL '30 days';

  IF (
    SELECT COUNT(*) FROM public.membership_email_link_requests
    WHERE app_email = v_app_email AND created_at >= NOW() - INTERVAL '15 minutes'
  ) >= 3 OR (
    SELECT COUNT(*) FROM public.membership_email_link_requests
    WHERE app_email = v_app_email AND created_at >= NOW() - INTERVAL '1 day'
  ) >= 5 OR (
    SELECT COUNT(*) FROM public.membership_email_link_requests
    WHERE purchase_email = v_purchase_email AND created_at >= NOW() - INTERVAL '1 day'
  ) >= 5 THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'rate_limited');
  END IF;

  INSERT INTO public.membership_email_link_requests(
    id, app_email, purchase_email, code_hash, expires_at
  ) VALUES (
    p_request_id, v_app_email, v_purchase_email, p_code_hash, p_expires_at
  );

  -- Send the same verification email for any syntactically valid address.
  -- Membership is checked only after the recipient proves ownership, so this
  -- endpoint cannot be used to discover which addresses purchased access.
  v_send_email := v_purchase_email <> v_app_email AND NOT EXISTS (
      SELECT 1 FROM public.membership_email_links link
      WHERE link.app_email = v_app_email
    );

  RETURN jsonb_build_object('accepted', true, 'sendEmail', v_send_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_membership_email_link(
  p_request_id UUID,
  p_app_email TEXT,
  p_code_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.membership_email_link_requests%ROWTYPE;
  v_app_email TEXT := LOWER(TRIM(p_app_email));
BEGIN
  SELECT * INTO v_request
  FROM public.membership_email_link_requests
  WHERE id = p_request_id AND app_email = v_app_email
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_request');
  END IF;
  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'reason', v_request.status);
  END IF;
  IF v_request.expires_at <= NOW() THEN
    UPDATE public.membership_email_link_requests SET status = 'expired' WHERE id = v_request.id;
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;

  IF v_request.code_hash <> p_code_hash THEN
    UPDATE public.membership_email_link_requests
    SET attempt_count = LEAST(5, attempt_count + 1),
        status = CASE WHEN attempt_count + 1 >= 5 THEN 'failed' ELSE status END
    WHERE id = v_request.id;
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'invalid_code',
      'remainingAttempts', GREATEST(0, 4 - v_request.attempt_count)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users source_user
    WHERE source_user.email = v_request.purchase_email
      AND source_user.is_pro IS TRUE
      AND (source_user.pro_expires_at IS NULL OR source_user.pro_expires_at > NOW())
  ) THEN
    UPDATE public.membership_email_link_requests SET status = 'failed' WHERE id = v_request.id;
    RETURN jsonb_build_object('success', false, 'reason', 'membership_not_active');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.membership_email_links
    WHERE app_email = v_app_email AND purchase_email = v_request.purchase_email
  ) THEN
    UPDATE public.membership_email_link_requests
    SET status = 'verified', verified_at = NOW()
    WHERE id = v_request.id;
    RETURN jsonb_build_object('success', true, 'alreadyLinked', true);
  END IF;

  IF EXISTS (SELECT 1 FROM public.membership_email_links WHERE app_email = v_app_email) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'app_already_linked');
  END IF;
  IF EXISTS (SELECT 1 FROM public.membership_email_links WHERE purchase_email = v_request.purchase_email) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'purchase_already_linked');
  END IF;

  INSERT INTO public.membership_email_links(app_email, purchase_email, verified_at)
  VALUES (v_app_email, v_request.purchase_email, NOW());

  UPDATE public.membership_email_link_requests
  SET status = 'verified', verified_at = NOW()
  WHERE id = v_request.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.create_membership_email_link_request(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_membership_email_link(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_membership_email_link_request(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_membership_email_link(UUID, TEXT, TEXT)
  TO service_role;
