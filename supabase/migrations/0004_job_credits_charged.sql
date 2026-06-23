-- Track whether job credits were reserved at creation (vs legacy charge-on-complete).
alter table public.image_jobs
  add column if not exists credits_charged boolean not null default false;
