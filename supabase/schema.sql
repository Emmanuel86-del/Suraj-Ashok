-- 1. PROFILES + SIGNUP TRIGGER (assumes public.vehicles and public.drivers already exist)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text,
  role text not null default 'staff' check (role in ('corporate_admin','manager','staff')),
  sub_account text, created_at timestamptz default now());
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into public.profiles(id,email) values (new.id,new.email) on conflict do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 2. TYRES
create table if not exists public.tyres (
  id uuid primary key default gen_random_uuid(), sub_account text,
  tyre_id text not null unique, brand text not null, size text not null, serial_number text,
  type text check (type in ('new','retreaded','second_hand')),
  status text not null default 'in_store' check (status in ('in_store','in_use','worn_out','punctured','retired')),
  current_truck_id uuid references public.vehicles(id),
  position text check (position in ('FL','FR','RL','RR','RL2','RR2','spare')),
  fitted_date date, removed_date date, km_at_fitting numeric, km_at_removal numeric,
  km_run numeric generated always as (km_at_removal - km_at_fitting) stored,
  removal_reason text, cost numeric, supplier text, notes text,
  documents text[] default '{}', created_at timestamptz default now());
create table if not exists public.tyre_history (
  id uuid primary key default gen_random_uuid(),
  tyre_id uuid references public.tyres(id) on delete cascade,
  truck_id uuid references public.vehicles(id),
  action text not null check (action in ('fitted','removed','rotated','retreaded','repaired','retired')),
  action_date date not null default current_date, position text, km_at_action numeric,
  km_run_this_stint numeric, reason text, cost numeric, performed_by text, notes text,
  created_at timestamptz default now());

-- 3. COMPLIANCE
create table if not exists public.vehicle_compliance (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  compliance_type text not null check (compliance_type in ('insurance','ntsa_inspection','speed_governor','fire_extinguisher','first_aid','annual_service','other')),
  policy_or_cert_number text, insurer_or_authority text, issue_date date, expiry_date date not null,
  renewal_cost numeric, status text default 'active' check (status in ('active','expired','pending_renewal','renewed')),
  alert_days_before integer default 30, documents text[] default '{}', notes text, created_at timestamptz default now());
create table if not exists public.driver_compliance (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id) on delete cascade,
  compliance_type text not null check (compliance_type in ('driving_licence','psv_badge','medical_certificate','nssf','sha','other')),
  document_number text, issue_date date, expiry_date date not null,
  status text default 'active' check (status in ('active','expired','pending_renewal','renewed')),
  alert_days_before integer default 30, documents text[] default '{}', notes text, created_at timestamptz default now());

alter table public.tyres enable row level security;
alter table public.tyre_history enable row level security;
alter table public.vehicle_compliance enable row level security;
alter table public.driver_compliance enable row level security;
create policy "auth tyres" on public.tyres for all to authenticated using (true) with check (true);
create policy "auth tyre_history" on public.tyre_history for all to authenticated using (true) with check (true);
create policy "auth vehicle_compliance" on public.vehicle_compliance for all to authenticated using (true) with check (true);
create policy "auth driver_compliance" on public.driver_compliance for all to authenticated using (true) with check (true);
