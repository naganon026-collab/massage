-- ============================================================
-- 管理画面（/admin）用 Supabase 事前準備
-- 実行場所: Supabase Dashboard > SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- ① generation_history に 3 カラムを追加
-- ------------------------------------------------------------
ALTER TABLE generation_history
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS tokens INTEGER,
  ADD COLUMN IF NOT EXISTS error TEXT;

-- ------------------------------------------------------------
-- ② shops に created_at を追加（なければ）
-- ------------------------------------------------------------
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ------------------------------------------------------------
-- ③ auth.users を安全に読み取る DB 関数を作成
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT
    id,
    email,
    created_at,
    last_sign_in_at
  FROM auth.users
  ORDER BY created_at DESC;
$$;

-- 管理者のみ実行可能にする
REVOKE ALL ON FUNCTION get_all_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;

-- ------------------------------------------------------------
-- ④ 管理画面用：管理者メールのユーザーは全件 SELECT 可能
-- （get_all_users で全ユーザー取得後、shops・generation_history を
--   一覧表示するため、管理者には全行の SELECT を許可する）
-- ------------------------------------------------------------
-- shops: 管理者は全行参照可能
DROP POLICY IF EXISTS shops_select_admin_policy ON shops;
CREATE POLICY shops_select_admin_policy ON shops
  FOR SELECT
  USING (
    LOWER(auth.jwt() ->> 'email') = LOWER('naganon026@gmail.com')
  );

-- generation_history: 管理者は全行参照可能
DROP POLICY IF EXISTS generation_history_select_admin_policy ON generation_history;
CREATE POLICY generation_history_select_admin_policy ON generation_history
  FOR SELECT
  USING (
    LOWER(auth.jwt() ->> 'email') = LOWER('naganon026@gmail.com')
  );
