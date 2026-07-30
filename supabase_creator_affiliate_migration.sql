-- SausageMenu creator attribution and first-purchase commission ledger.
-- Safe to run more than once after supabase_migration.sql.

CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code = UPPER(BTRIM(code)) AND code ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$'),
  display_name TEXT NOT NULL,
  email TEXT,
  revenuecat_app_user_id UUID REFERENCES users(revenuecat_app_user_id) ON DELETE SET NULL,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.2000 CHECK (commission_rate BETWEEN 0 AND 1),
  complimentary_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_creators_status ON creators(status);

CREATE TABLE IF NOT EXISTS creator_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenuecat_app_user_id UUID NOT NULL REFERENCES users(revenuecat_app_user_id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired', 'cancelled')),
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  converted_at TIMESTAMPTZ,
  original_transaction_id TEXT,
  UNIQUE (revenuecat_app_user_id)
);
CREATE INDEX IF NOT EXISTS idx_creator_attributions_creator ON creator_attributions(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_attributions_status_expires ON creator_attributions(status, expires_at);

CREATE TABLE IF NOT EXISTS revenuecat_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  transaction_id TEXT,
  environment TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_status TEXT NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received', 'processed', 'ignored', 'failed')),
  failure_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_rc_webhook_transaction ON revenuecat_webhook_events(transaction_id) WHERE transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'TWD',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid', 'cancelled')),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_end >= period_start)
);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator ON creator_payouts(creator_id, created_at DESC);

CREATE TABLE IF NOT EXISTS creator_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE RESTRICT,
  attribution_id UUID NOT NULL REFERENCES creator_attributions(id) ON DELETE RESTRICT,
  payout_id UUID REFERENCES creator_payouts(id) ON DELETE SET NULL,
  revenuecat_event_id TEXT NOT NULL UNIQUE,
  revenuecat_app_user_id UUID NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  original_transaction_id TEXT,
  environment TEXT NOT NULL DEFAULT 'PRODUCTION' CHECK (environment IN ('PRODUCTION', 'SANDBOX')),
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  product_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  customer_price NUMERIC(12,2) CHECK (customer_price IS NULL OR customer_price >= 0),
  estimated_net_revenue NUMERIC(12,2) CHECK (estimated_net_revenue IS NULL OR estimated_net_revenue >= 0),
  final_net_revenue NUMERIC(12,2) CHECK (final_net_revenue IS NULL OR final_net_revenue >= 0),
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.2000 CHECK (commission_rate BETWEEN 0 AND 1),
  estimated_commission NUMERIC(12,2) CHECK (estimated_commission IS NULL OR estimated_commission >= 0),
  final_commission NUMERIC(12,2) CHECK (final_commission IS NULL OR final_commission >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'reversed')),
  purchased_at TIMESTAMPTZ NOT NULL,
  hold_until TIMESTAMPTZ NOT NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_creator_commissions_creator_status ON creator_commissions(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_creator_commissions_hold ON creator_commissions(status, hold_until);
CREATE INDEX IF NOT EXISTS idx_creator_commissions_original_transaction ON creator_commissions(original_transaction_id) WHERE original_transaction_id IS NOT NULL;

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenuecat_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_commissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON creators, creator_attributions, revenuecat_webhook_events, creator_payouts, creator_commissions FROM anon, authenticated;
