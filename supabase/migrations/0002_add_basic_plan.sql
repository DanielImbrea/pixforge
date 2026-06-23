-- Add "basic" paid tier (€1.9/mo — no watermark, same daily quota as free)

alter table public.users drop constraint if exists users_plan_check;
alter table public.users add constraint users_plan_check
  check (plan in ('free', 'basic', 'starter', 'pro'));

alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions add constraint subscriptions_plan_check
  check (plan in ('basic', 'starter', 'pro'));
