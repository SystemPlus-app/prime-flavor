-- Prime Flavor — isolated schema inside the shared Supabase project
-- (this project also hosts Neopeptideus and RioCali Spa in their own schemas/tables —
--  everything here lives under `prime_flavor` so it never collides with theirs)

create schema if not exists prime_flavor;

create sequence if not exists prime_flavor.order_number_seq start with 411;

create table if not exists prime_flavor.orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null default nextval('prime_flavor.order_number_seq'),
  customer_name text,
  items jsonb not null,
  subtotal numeric(10,2) not null,
  tax numeric(10,2) not null,
  total numeric(10,2) not null,
  payment_status text not null default 'UNPAID',
  status text not null default 'NEW',
  source text not null default 'KIOSK',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prime_flavor.product_availability (
  product_id text primary key,
  available boolean not null default true,
  visible boolean not null default true,
  price numeric(10,2),
  updated_at timestamptz not null default now()
);

alter table prime_flavor.orders enable row level security;
alter table prime_flavor.product_availability enable row level security;

-- Read-only for the public/anon key (used client-side by Kiosk, Kitchen, Admin for
-- live queries + Realtime subscriptions). All writes go through Next.js API routes
-- using the service_role key, which bypasses RLS — so the anon key never gets write access.
drop policy if exists orders_select_anon on prime_flavor.orders;
create policy orders_select_anon on prime_flavor.orders
  for select to anon using (true);

drop policy if exists availability_select_anon on prime_flavor.product_availability;
create policy availability_select_anon on prime_flavor.product_availability
  for select to anon using (true);

-- Enable Realtime change feeds for these two tables
alter publication supabase_realtime add table prime_flavor.orders;
alter publication supabase_realtime add table prime_flavor.product_availability;

-- Schema/table-level grants — required in addition to RLS policies and the
-- "Exposed schemas" Data API setting, or PostgREST returns "permission denied for schema".
grant usage on schema prime_flavor to anon, authenticated, service_role;
grant select on prime_flavor.orders, prime_flavor.product_availability to anon, authenticated;
grant all on prime_flavor.orders, prime_flavor.product_availability to service_role;
grant usage, select on prime_flavor.order_number_seq to service_role;
alter default privileges in schema prime_flavor grant select on tables to anon, authenticated;
alter default privileges in schema prime_flavor grant all on tables to service_role;
