-- Pro API keys (hashed at rest; plain key shown once on creation)

create table public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null default 'Default',
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index idx_api_keys_user on public.api_keys(user_id);
create index idx_api_keys_hash on public.api_keys(key_hash) where revoked_at is null;

alter table public.api_keys enable row level security;

create policy "api_keys_select_own" on public.api_keys
  for select using (auth.uid() = user_id);

create policy "api_keys_insert_own" on public.api_keys
  for insert with check (auth.uid() = user_id);

create policy "api_keys_update_own" on public.api_keys
  for update using (auth.uid() = user_id);
