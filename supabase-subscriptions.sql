-- Stripe サブスクリプション用テーブル
-- 実行: Supabase SQL Editor で実行

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'standard')),
  status TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan
  ON subscriptions(plan);

-- RLS: ユーザーは自分の行のみ参照可能
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_select_own ON subscriptions;
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS subscriptions_insert_own ON subscriptions;
CREATE POLICY subscriptions_insert_own ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS subscriptions_update_own ON subscriptions;
CREATE POLICY subscriptions_update_own ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 決済成功時はユーザーセッション付きで upsert 可能。Webhook はセッションがないため
-- 環境変数 SUPABASE_SERVICE_ROLE_KEY で createAdminClient() を使用すること。
DROP POLICY IF EXISTS subscriptions_upsert_own ON subscriptions;
CREATE POLICY subscriptions_upsert_own ON subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE subscriptions IS 'Stripe サブスクリプション状態（free / standard）';
