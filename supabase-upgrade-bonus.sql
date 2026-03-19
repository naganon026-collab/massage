-- アップグレード時のボーナス回数（Light→Standard 等で「プラス100回」を実現）
-- 実行: Supabase SQL Editor で実行
-- 前プランのlimit分を今月の上限に加算（例: Light 30回使用後→Standard で 100+30=130回）

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS upgrade_bonus_uses INTEGER DEFAULT 0;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS upgrade_bonus_period_end TIMESTAMPTZ;

COMMENT ON COLUMN subscriptions.upgrade_bonus_uses IS 'アップグレード時に付与するボーナス回数（前プランのlimit）';
COMMENT ON COLUMN subscriptions.upgrade_bonus_period_end IS 'ボーナス有効期限（この期間内のみ加算）';
