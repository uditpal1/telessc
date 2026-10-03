-- SSC GD Telegram Mini App prototype
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id text unique not null,
  telegram_username text,
  name text not null,
  role text not null default 'user' check (role in ('admin','sub_admin','user')),
  ssc_gd_premium boolean not null default false,
  referral_code_used text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  test_id text not null,
  test_type text not null check (test_type in ('full','subject')),
  attempt_number integer not null,
  score numeric(8,2) not null,
  correct integer not null default 0,
  wrong integer not null default 0,
  skipped integer not null default 0,
  time_taken integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(10,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_idx on public.attempts(user_id);
create index if not exists attempts_test_idx on public.attempts(test_id);

alter table public.users enable row level security;
alter table public.attempts enable row level security;
alter table public.referral_codes enable row level security;

-- IMPORTANT:
-- The frontend prototype shown here is intentionally simple.
-- For production, put Telegram initData verification and privileged DB operations
-- behind a server/Edge Function and use RLS policies tied to verified identity.
-- Do not expose a service_role key in frontend JavaScript.

-- Prototype policies:
create policy "prototype users select" on public.users
for select using (true);

create policy "prototype users insert" on public.users
for insert with check (role = 'user');

create policy "prototype attempts insert" on public.attempts
for insert with check (true);

create policy "prototype attempts select" on public.attempts
for select using (true);

create policy "prototype referrals select" on public.referral_codes
for select using (is_active = true);

-- After creating your first account, manually set ONE user to admin:
-- update public.users set role='admin' where telegram_id='YOUR_TELEGRAM_ID';
--
-- Then tighten RLS before production.
