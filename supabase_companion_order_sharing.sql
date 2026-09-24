-- Secure companion ordering sessions for the native App / SausageMenu-v2.
-- All reads and writes go through server API routes using service_role.
-- The share token is stored as a SHA-256 hash, never as plaintext.

CREATE TABLE IF NOT EXISTS public.companion_order_sessions (
  id UUID PRIMARY KEY,
  owner_email TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('menu', 'instant')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  token_hash TEXT NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT companion_order_sessions_owner_email_normalized
    CHECK (owner_email = LOWER(TRIM(owner_email))),
  CONSTRAINT companion_order_sessions_expiry_after_creation
    CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_companion_order_sessions_owner_active
  ON public.companion_order_sessions(owner_email, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.companion_order_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.companion_order_sessions(id) ON DELETE CASCADE,
  guest_id TEXT NOT NULL CHECK (char_length(guest_id) BETWEEN 1 AND 80),
  guest_name TEXT NOT NULL CHECK (char_length(guest_name) BETWEEN 1 AND 48),
  item_key TEXT NOT NULL CHECK (char_length(item_key) BETWEEN 1 AND 180),
  original_name TEXT NOT NULL CHECK (char_length(original_name) BETWEEN 1 AND 500),
  translated_name TEXT NOT NULL DEFAULT '' CHECK (char_length(translated_name) <= 500),
  quantity SMALLINT NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, guest_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_companion_order_entries_session
  ON public.companion_order_entries(session_id, created_at);

ALTER TABLE public.companion_order_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_order_entries ENABLE ROW LEVEL SECURITY;

-- Do not expose either table through the browser/Data API. API routes verify a
-- signed owner session or the unguessable share token before using service_role.
REVOKE ALL ON TABLE public.companion_order_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.companion_order_entries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companion_order_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companion_order_entries TO service_role;

-- Private image objects are only read and written by the server-side service key.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'companion-order-images',
  'companion-order-images',
  FALSE,
  5242880,
  ARRAY['image/jpeg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
