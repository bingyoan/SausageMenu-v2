-- Private, account-scoped menu library backup.
-- Safe to run more than once. The app accesses this table only through its
-- authenticated server route; browser clients never receive table privileges.

CREATE TABLE IF NOT EXISTS public.saved_menu_library (
  user_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  menu_id TEXT NOT NULL,
  menu_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (user_email, menu_id),
  CONSTRAINT saved_menu_library_email_normalized
    CHECK (user_email = LOWER(TRIM(user_email))),
  CONSTRAINT saved_menu_library_payload_object
    CHECK (
      (deleted_at IS NULL AND jsonb_typeof(menu_payload) = 'object')
      OR (deleted_at IS NOT NULL AND menu_payload IS NULL)
    )
);

-- Keep repeat runs compatible if an earlier draft of this table already exists.
ALTER TABLE public.saved_menu_library ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.saved_menu_library ALTER COLUMN menu_payload DROP NOT NULL;
ALTER TABLE public.saved_menu_library DROP CONSTRAINT IF EXISTS saved_menu_library_payload_object;
ALTER TABLE public.saved_menu_library ADD CONSTRAINT saved_menu_library_payload_object
  CHECK (
    (deleted_at IS NULL AND jsonb_typeof(menu_payload) = 'object')
    OR (deleted_at IS NOT NULL AND menu_payload IS NULL)
  );

CREATE INDEX IF NOT EXISTS idx_saved_menu_library_user_updated
  ON public.saved_menu_library(user_email, updated_at DESC);

ALTER TABLE public.saved_menu_library ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.saved_menu_library FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.saved_menu_library TO service_role;
