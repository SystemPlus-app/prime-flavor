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
  image_url text,
  updated_at timestamptz not null default now()
);

-- Brand-new dishes added from Admin (not part of the built-in menu list in code).
-- Sold-out/hidden/price-override state for these still lives in product_availability,
-- keyed by this table's id — same mechanism as the built-in menu items.
create table if not exists prime_flavor.custom_products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(10,2) not null,
  description text,
  image_url text,
  popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Event ticket redemption: a client can sell/comp plates ahead of time via
-- physical paper tickets (numbered rolls). Each batch defines an inclusive
-- ticket-number range and which dishes it covers; redemption is scoped to a
-- single batch so different events can reuse overlapping roll numbers.
create table if not exists prime_flavor.ticket_batches (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  ticket_start integer not null,
  ticket_end integer not null,
  allowed_product_ids text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ticket_batches_range_check check (ticket_end >= ticket_start)
);

create table if not exists prime_flavor.redeemed_tickets (
  batch_id uuid not null references prime_flavor.ticket_batches(id) on delete cascade,
  ticket_number integer not null,
  order_id uuid references prime_flavor.orders(id) on delete set null,
  redeemed_at timestamptz not null default now(),
  primary key (batch_id, ticket_number)
);

alter table prime_flavor.orders enable row level security;
alter table prime_flavor.product_availability enable row level security;
alter table prime_flavor.custom_products enable row level security;
alter table prime_flavor.ticket_batches enable row level security;
alter table prime_flavor.redeemed_tickets enable row level security;

-- Read-only for the public/anon key (used client-side by Kiosk, Kitchen, Admin for
-- live queries + Realtime subscriptions). All writes go through Next.js API routes
-- using the service_role key, which bypasses RLS — so the anon key never gets write access.
drop policy if exists orders_select_anon on prime_flavor.orders;
create policy orders_select_anon on prime_flavor.orders
  for select to anon using (true);

drop policy if exists availability_select_anon on prime_flavor.product_availability;
create policy availability_select_anon on prime_flavor.product_availability
  for select to anon using (true);

drop policy if exists custom_products_select_anon on prime_flavor.custom_products;
create policy custom_products_select_anon on prime_flavor.custom_products
  for select to anon using (true);

drop policy if exists ticket_batches_select_anon on prime_flavor.ticket_batches;
create policy ticket_batches_select_anon on prime_flavor.ticket_batches
  for select to anon using (true);

drop policy if exists redeemed_tickets_select_anon on prime_flavor.redeemed_tickets;
create policy redeemed_tickets_select_anon on prime_flavor.redeemed_tickets
  for select to anon using (true);

-- Enable Realtime change feeds for these tables
alter publication supabase_realtime add table prime_flavor.orders;
alter publication supabase_realtime add table prime_flavor.product_availability;
alter publication supabase_realtime add table prime_flavor.custom_products;
alter publication supabase_realtime add table prime_flavor.ticket_batches;
alter publication supabase_realtime add table prime_flavor.redeemed_tickets;

-- Schema/table-level grants — required in addition to RLS policies and the
-- "Exposed schemas" Data API setting, or PostgREST returns "permission denied for schema".
grant usage on schema prime_flavor to anon, authenticated, service_role;
grant select on prime_flavor.orders, prime_flavor.product_availability, prime_flavor.custom_products, prime_flavor.ticket_batches, prime_flavor.redeemed_tickets to anon, authenticated;
grant all on prime_flavor.orders, prime_flavor.product_availability, prime_flavor.custom_products, prime_flavor.ticket_batches, prime_flavor.redeemed_tickets to service_role;
grant usage, select on prime_flavor.order_number_seq to service_role;
alter default privileges in schema prime_flavor grant select on tables to anon, authenticated;
alter default privileges in schema prime_flavor grant all on tables to service_role;
