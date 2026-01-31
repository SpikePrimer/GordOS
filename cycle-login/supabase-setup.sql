-- Run this in Supabase Dashboard → SQL Editor to enable cross-device accounts.
-- Then set CYCLE_LOGIN_SUPABASE_URL and CYCLE_LOGIN_SUPABASE_ANON_KEY in cycle-login/config.js.

-- Tables
create table if not exists public.cycle_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  cycle_codes jsonb not null default '[]',
  license_expires_at bigint,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists public.cycle_visits (
  id uuid primary key default gen_random_uuid(),
  username text,
  type text,
  referrer text,
  cycle int,
  timestamp bigint,
  duration_ms int,
  session_start bigint
);

create table if not exists public.cycle_state (
  key text primary key,
  value jsonb not null default '0'
);

-- Seed visit count so it exists
insert into public.cycle_state (key, value)
values ('visit_count', '0')
on conflict (key) do nothing;

-- Allow anonymous read/write (your app uses the anon key from config.js)
alter table public.cycle_users enable row level security;
alter table public.cycle_visits enable row level security;
alter table public.cycle_state enable row level security;

create policy "Allow anon all on cycle_users"
  on public.cycle_users for all
  to anon using (true) with check (true);

create policy "Allow anon all on cycle_visits"
  on public.cycle_visits for all
  to anon using (true) with check (true);

create policy "Allow anon all on cycle_state"
  on public.cycle_state for all
  to anon using (true) with check (true);
