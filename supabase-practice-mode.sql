-- ============================================================
-- 練習モード用：generation_history に is_practice カラムを追加
-- 実行場所: Supabase Dashboard > SQL Editor
-- ============================================================
-- 練習モードの1回目の生成は5回枠にカウントしないため、
-- is_practice = true の行は getMonthlyGenerationCount / getDailyGenerationCount で除外する

ALTER TABLE generation_history
  ADD COLUMN IF NOT EXISTS is_practice BOOLEAN DEFAULT FALSE;
