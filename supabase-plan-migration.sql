-- subscriptions.plan に light / pro を追加
-- 実行: Supabase SQL Editor で実行

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'light', 'standard', 'pro'));

COMMENT ON TABLE subscriptions IS 'Stripe サブスクリプション状態（free / light / standard / pro）';
