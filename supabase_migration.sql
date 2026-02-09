-- =========================================================
-- 🗄️ SausageMenu v2.0 資料庫遷移腳本
-- 為 Google Play 訂閱制做準備
-- =========================================================

-- 1️⃣ 添加新欄位到 users 表
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_usage_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_usage_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 2️⃣ 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_last_usage_date ON users(last_usage_date);

-- 3️⃣ 設定 subscription_status 的有效值
-- 可選值: 'free', 'active', 'expired', 'cancelled'
COMMENT ON COLUMN users.subscription_status IS 'Subscription status: free, active, expired, cancelled';

-- 4️⃣ 創建每日重置使用次數的函數 (可選 - 透過 Cron Job 執行)
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET daily_usage_count = 0 
  WHERE last_usage_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 📋 完成後的 users 表結構：
-- =========================================================
-- email              TEXT PRIMARY KEY
-- google_id          TEXT UNIQUE (Google 用戶 ID)
-- display_name       TEXT (顯示名稱)
-- photo_url          TEXT (頭像 URL)
-- is_pro             BOOLEAN (是否為 PRO 用戶)
-- pro_expires_at     TIMESTAMPTZ (PRO 到期時間)
-- subscription_status TEXT (訂閱狀態: free/active/expired/cancelled)
-- is_counted         BOOLEAN (是否已計入統計)
-- daily_usage_count  INTEGER (今日使用次數)
-- last_usage_date    DATE (最後使用日期)
-- notes              TEXT (備註)
-- created_at         TIMESTAMPTZ (創建時間)
-- last_login_at      TIMESTAMPTZ (最後登入時間)
-- =========================================================
