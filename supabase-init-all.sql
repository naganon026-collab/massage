-- ============================================================
-- Supabase 初期設定 (ALL-IN-ONE)
-- 実行場所: Supabase Dashboard > SQL Editor
-- 概要: 新規プロジェクトのテーブル作成、制約、RLS設定
-- ============================================================

-- ------------------------------------------------------------
-- 1. テーブル作成
-- ------------------------------------------------------------

-- subscriptions: サブスクリプション管理
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'light', 'standard', 'pro')),
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- shops: ユーザーごとの店舗設定（旧形式）
CREATE TABLE IF NOT EXISTS shops (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- stores: 管理者用店舗管理
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email TEXT NOT NULL,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- generation_history: AI生成履歴
CREATE TABLE IF NOT EXISTS generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id TEXT,
  pattern_title TEXT,
  inputs JSONB DEFAULT '{}'::JSONB,
  results JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  model TEXT,
  tokens INTEGER,
  error TEXT,
  is_practice BOOLEAN DEFAULT false
);

-- shop_integrations: 外部連携（LINE, Instagram等）
CREATE TABLE IF NOT EXISTS shop_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('line', 'instagram', 'gbp', 'late')),
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- ------------------------------------------------------------
-- 2. インデックス作成
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_owner_email ON stores(owner_email);

-- ------------------------------------------------------------
-- 3. RLS 有効化
-- ------------------------------------------------------------
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_integrations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 4. RLS ポリシー設定
-- ------------------------------------------------------------

-- subscriptions
DROP POLICY IF EXISTS subscriptions_all_policy ON subscriptions;
CREATE POLICY subscriptions_all_policy ON subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- shops
DROP POLICY IF EXISTS shops_all_policy ON shops;
CREATE POLICY shops_all_policy ON shops FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- stores
DROP POLICY IF EXISTS stores_select_policy ON stores;
CREATE POLICY stores_select_policy ON stores FOR SELECT USING (
  LOWER(owner_email) = LOWER(auth.jwt() ->> 'email') OR LOWER(auth.jwt() ->> 'email') = LOWER('naganon026@gmail.com')
);
DROP POLICY IF EXISTS stores_write_policy ON stores;
CREATE POLICY stores_write_policy ON stores FOR ALL USING (
  LOWER(owner_email) = LOWER(auth.jwt() ->> 'email') OR LOWER(auth.jwt() ->> 'email') = LOWER('naganon026@gmail.com')
) WITH CHECK (
  LOWER(owner_email) = LOWER(auth.jwt() ->> 'email') OR LOWER(auth.jwt() ->> 'email') = LOWER('naganon026@gmail.com')
);

-- generation_history
DROP POLICY IF EXISTS generation_history_all_policy ON generation_history;
CREATE POLICY generation_history_all_policy ON generation_history FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- shop_integrations
DROP POLICY IF EXISTS integrations_all_policy ON shop_integrations;
CREATE POLICY integrations_all_policy ON shop_integrations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
