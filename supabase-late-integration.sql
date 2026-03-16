-- supabase-late-integration.sql
-- Late (getlate.dev) 連携用：platform に 'late' を追加
-- shop_integrations が既に存在する場合に実行

-- platform の CHECK 制約を更新（'late' を追加）
ALTER TABLE shop_integrations DROP CONSTRAINT IF EXISTS shop_integrations_platform_check;
ALTER TABLE shop_integrations ADD CONSTRAINT shop_integrations_platform_check
  CHECK (platform IN ('line', 'instagram', 'gbp', 'late'));
