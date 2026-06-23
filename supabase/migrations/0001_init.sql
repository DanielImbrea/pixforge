-- ============================================
-- EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  stripe_customer_id text unique,
  locale text not null default 'en' check (locale in ('en', 'ro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_users_stripe_customer on public.users(stripe_customer_id);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_price_id text not null,
  plan text not null check (plan in ('starter', 'pro')),
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_subscriptions_status on public.subscriptions(status);

-- ============================================
-- PAYMENTS
-- ============================================
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_invoice_id text unique,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  currency text not null default 'eur',
  status text not null check (status in ('succeeded', 'failed', 'refunded', 'pending')),
  created_at timestamptz not null default now()
);
create index idx_payments_user on public.payments(user_id);

-- ============================================
-- TOOL_USAGE
-- ============================================
create table public.tool_usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  period_start date not null,
  process_count integer not null default 0,
  unit_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_start)
);
create index idx_tool_usage_user_period on public.tool_usage(user_id, period_start);

-- ============================================
-- STORAGE_FILES
-- ============================================
create table public.storage_files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  bucket text not null check (bucket in ('uploads', 'outputs', 'previews')),
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  width_px integer,
  height_px integer,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create index idx_storage_files_user on public.storage_files(user_id);
create index idx_storage_files_expires on public.storage_files(expires_at) where expires_at is not null;

-- ============================================
-- IMAGE_ASSETS
-- ============================================
create table public.image_assets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  storage_file_id uuid not null references public.storage_files(id) on delete cascade,
  asset_type text not null check (asset_type in ('input', 'output', 'preview')),
  is_watermarked boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_image_assets_user on public.image_assets(user_id);
create index idx_image_assets_storage_file on public.image_assets(storage_file_id);

-- ============================================
-- IMAGE_JOBS
-- ============================================
create table public.image_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  tool_id text not null,
  input_asset_id uuid not null references public.image_assets(id),
  output_asset_id uuid references public.image_assets(id),
  preview_asset_id uuid references public.image_assets(id),
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  params jsonb not null default '{}',
  units_cost integer not null default 1,
  error_message text,
  provider_job_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index idx_image_jobs_user on public.image_jobs(user_id);
create index idx_image_jobs_status on public.image_jobs(status);
create index idx_image_jobs_provider_job on public.image_jobs(provider_job_id);
create index idx_image_jobs_tool on public.image_jobs(tool_id);

-- ============================================
-- updated_at TRIGGER HELPER
-- ============================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger trg_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger trg_tool_usage_updated_at before update on public.tool_usage
  for each row execute function public.set_updated_at();

-- ============================================
-- AUTO-CREATE public.users ON SIGNUP
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.tool_usage enable row level security;
alter table public.storage_files enable row level security;
alter table public.image_assets enable row level security;
alter table public.image_jobs enable row level security;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

create policy "tool_usage_select_own" on public.tool_usage
  for select using (auth.uid() = user_id);

create policy "storage_files_select_own" on public.storage_files
  for select using (auth.uid() = user_id);
create policy "storage_files_insert_own" on public.storage_files
  for insert with check (auth.uid() = user_id);
create policy "storage_files_delete_own" on public.storage_files
  for delete using (auth.uid() = user_id);

create policy "image_assets_select_own" on public.image_assets
  for select using (auth.uid() = user_id);
create policy "image_assets_insert_own" on public.image_assets
  for insert with check (auth.uid() = user_id);

create policy "image_jobs_select_own" on public.image_jobs
  for select using (auth.uid() = user_id);
create policy "image_jobs_insert_own" on public.image_jobs
  for insert with check (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('outputs', 'outputs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('previews', 'previews', false)
on conflict (id) do nothing;
