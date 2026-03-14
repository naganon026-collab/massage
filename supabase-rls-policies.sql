-- ============================================================
-- Supabase Row Level Security (RLS) 設定
-- 実行場所: Supabase Dashboard > SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. RLS を有効化
-- ------------------------------------------------------------
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 2. 既存ポリシーを削除（存在する場合のみ）
-- ------------------------------------------------------------

-- shops
DROP POLICY IF EXISTS shops_select_policy ON shops;
DROP POLICY IF EXISTS shops_insert_policy ON shops;
DROP POLICY IF EXISTS shops_update_policy ON shops;
DROP POLICY IF EXISTS shops_delete_policy ON shops;

-- stores
DROP POLICY IF EXISTS stores_select_policy ON stores;
DROP POLICY IF EXISTS stores_insert_policy ON stores;
DROP POLICY IF EXISTS stores_update_policy ON stores;
DROP POLICY IF EXISTS stores_delete_policy ON stores;

-- generation_history
DROP POLICY IF EXISTS generation_history_select_policy ON generation_history;
DROP POLICY IF EXISTS generation_history_insert_policy ON generation_history;
DROP POLICY IF EXISTS generation_history_update_policy ON generation_history;
DROP POLICY IF EXISTS generation_history_delete_policy ON generation_history;

-- ------------------------------------------------------------
-- 3. 新しいポリシーを作成
-- ------------------------------------------------------------

-- ---------- shops ----------
-- user_id が auth.uid() と一致する行のみ操作可能

CREATE POLICY shops_select_policy ON shops
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY shops_insert_policy ON shops
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY shops_update_policy ON shops
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY shops_delete_policy ON shops
  FOR DELETE
  USING (user_id = auth.uid());

-- ---------- stores ----------
-- owner_email が auth.jwt() の email と一致する行のみ操作可能（大文字・小文字区別なし）
-- ADMIN_EMAIL のユーザーは全行参照・操作可能

CREATE POLICY stores_select_policy ON stores
  FOR SELECT
  USING (
    LOWER(owner_email) = LOWER(auth.jwt() ->> 'email')
    OR LOWER(auth.jwt() ->> 'email') = LOWER('naganon026@gmail.com')
  );

CREATE POLICY stores_insert_policy ON stores
  FOR INSERT
  WITH CHECK (
    LOWER(owner_email) = LOWER(auth.jwt() ->> 'email')
    OR LOWER(auth.jwt() ->> 'email') = LOWER('naganon026@gmail.com')
  );

CREATE POLICY stores_update_policy ON stores
  FOR UPDATE
  USING (
    LOWER(owner_email) = LOWER(auth.jwt() ->> 'email')
    OR LOWER(auth.jwt() ->> 'email') = LOWER('naganon026@gmail.com')
  )
  WITH CHECK (
    LOWER(owner_email) = LOWER(auth.jwt() ->> 'email')
    OR LOWER(auth.jwt() ->> 'email') = LOWER('naganon026@gmail.com')
  );

CREATE POLICY stores_delete_policy ON stores
  FOR DELETE
  USING (
    LOWER(owner_email) = LOWER(auth.jwt() ->> 'email')
    OR LOWER(auth.jwt() ->> 'email') = LOWER('naganon026@gmail.com')
  );

-- ---------- generation_history ----------
-- user_id が auth.uid() と一致する行のみ操作可能

CREATE POLICY generation_history_select_policy ON generation_history
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY generation_history_insert_policy ON generation_history
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY generation_history_update_policy ON generation_history
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY generation_history_delete_policy ON generation_history
  FOR DELETE
  USING (user_id = auth.uid());
