-- supabase-line-integration.sql
-- LINE連携テーブル

create table if not exists shop_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('line', 'instagram', 'gbp')),
  access_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, platform)
);

-- RLS有効化
alter table shop_integrations enable row level security;

-- 自分のレコードのみ操作可能
create policy "Users can manage own integrations"
  on shop_integrations
  for all
  using (user_id = auth.uid());
