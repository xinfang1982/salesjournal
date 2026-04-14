-- SalesJournal Supabase Schema
-- Run this in the Supabase SQL editor to set up your database.

-- ─────────────────────────────────────────
-- Customers
-- ─────────────────────────────────────────
create table if not exists customers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  wechat_id        text,
  phone_number     text,
  shipping_address text,
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- Order Items
-- ─────────────────────────────────────────
create table if not exists order_items (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid references customers(id) on delete cascade,

  -- Product
  brand              text,
  product_name       text not null,
  provider           text,           -- e.g. Amazon, DM, Rossmann

  -- Pricing (EUR)
  price_per_qty_eur  numeric(10,2) not null default 0,
  quantity           integer not null default 1,
  total_price_eur    numeric(10,2) generated always as (price_per_qty_eur * quantity) stored,
  cost_eur           numeric(10,2) not null default 0,

  -- Pricing (RMB)
  cost_rmb           numeric(10,2) not null default 0,
  exchange_rate      numeric(10,4) not null default 0,
  amount_paid_rmb    numeric(10,2) generated always as (price_per_qty_eur * quantity * exchange_rate) stored,

  -- Margins (auto-calculated)
  margin_eur         numeric(10,2) generated always as ((price_per_qty_eur * quantity) - cost_eur) stored,
  margin_rmb         numeric(10,2) generated always as ((price_per_qty_eur * quantity * exchange_rate) - cost_rmb) stored,

  -- Dates
  purchase_date      date not null default current_date,
  delivery_date      date not null default current_date,

  -- Status
  order_status       text not null default 'Ordered'
                     check (order_status in ('Ordered', 'Goods Receipt', 'Goods Issue', 'Customer Confirms')),
  payment_status     text not null default 'Unpaid'
                     check (payment_status in ('Paid', 'Unpaid')),

  -- Notes
  notes              text,

  created_at         timestamptz default now()
);

-- ─────────────────────────────────────────
-- Additional Costs
-- ─────────────────────────────────────────
create table if not exists additional_costs (
  id          uuid primary key default gen_random_uuid(),
  description text not null,
  amount_rmb  numeric(10,2) not null default 0,
  date        date not null default current_date,
  created_at  timestamptz default now()
);
