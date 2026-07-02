-- Admin panel: roles, soft delete, audit logs

alter table public.users
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin'));

alter table public.users
  add column if not exists deleted_at timestamptz;

create index if not exists idx_users_role on public.users(role) where role = 'admin';
create index if not exists idx_users_deleted_at on public.users(deleted_at) where deleted_at is not null;

create table if not exists public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references public.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_created on public.admin_audit_logs(created_at desc);
create index if not exists idx_admin_audit_logs_admin on public.admin_audit_logs(admin_id);

alter table public.admin_audit_logs enable row level security;

-- No public policies: admin panel uses service role only.

-- Grant first admin (run manually after deploy):
-- update public.users set role = 'admin' where email = 'your@email.com';
-- Or set ADMIN_EMAIL on Vercel to your login email (comma-separated for multiple).
