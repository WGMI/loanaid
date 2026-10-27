-- LoanAid dummy pitch-demo schema
-- Alternative-data credit scoring engine + field app schema for Pathways Bank, simplified for a demo.

drop table if exists activity_log cascade;
drop table if exists loan_applications cascade;
drop table if exists scoring_tiers cascade;
drop table if exists scoring_fields cascade;
drop table if exists scoring_groups cascade;
drop table if exists products cascade;
drop table if exists scoring_configs cascade;
drop table if exists officers cascade;

create table officers (
  id serial primary key,
  name text not null,
  employee_code text not null unique,
  region text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- A named, reusable scorecard: a set of weighted groups, each holding dynamic fields
-- with their own JEXL scoring formulas, plus RAG decision tiers. Products are tied to
-- one configuration; new loans are scored under whichever configuration their product
-- currently points to. Mirrors the original UNCDF engine's Product/ProductGroup/
-- ProductField model, minus the parent/child product hierarchy and config versioning.
create table scoring_configs (
  id serial primary key,
  name text not null unique,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id serial primary key,
  name text not null,
  parent_id integer references products(id),
  status text not null default 'ACTIVE',
  scoring_config_id integer references scoring_configs(id),
  sort_order integer not null default 0
);

-- A weighted bucket of fields, e.g. "Household Stability" at 35%.
-- groupScore = sum(field raw scores in group) * weight_pct / 100
create table scoring_groups (
  id serial primary key,
  config_id integer not null references scoring_configs(id) on delete cascade,
  name text not null,
  weight_pct integer not null default 0,
  sort_order integer not null default 0
);

-- A single admin-defined scorecard input. `name` is the JEXL context variable the
-- field's own formula AND every other field's formula in the config can reference.
-- A field with no formula is skipped (contributes 0). A formula returning a negative
-- number triggers a knockout — decline regardless of every other field's score.
create table scoring_fields (
  id serial primary key,
  group_id integer not null references scoring_groups(id) on delete cascade,
  name text not null,
  label text not null,
  data_type text not null default 'NUMERIC'
    check (data_type in ('TEXT','NUMERIC','DECIMAL','DROP_DOWN','MULTI_SELECT','BOOLEAN','GPS_LOCATION')),
  options text,
  formula text,
  mandatory boolean not null default false,
  sort_order integer not null default 0
);

create table scoring_tiers (
  id serial primary key,
  config_id integer not null references scoring_configs(id) on delete cascade,
  tier text not null check (tier in ('green','amber','red')),
  label text not null,
  min_score integer,
  max_score integer,
  description text not null,
  unique (config_id, tier)
);

create table loan_applications (
  id serial primary key,
  app_code text not null unique,
  applicant_name text not null,
  national_id text not null,
  phone text,
  product_id integer references products(id),
  amount_ngn numeric(14,2) not null,
  region text not null,
  officer_id integer references officers(id),
  status text not null default 'draft'
    check (status in ('draft','queued','uploading','submitted','manual_review','approved','declined','sync_failed')),
  score integer,
  tier text check (tier in ('green','amber','red')),
  decision text,
  scoring_config_id integer references scoring_configs(id),
  knocked_out boolean not null default false,
  knock_out_field text,
  score_breakdown jsonb,
  submitted_fields jsonb,
  score_explanation text,
  gps_lat numeric(9,6),
  gps_lng numeric(9,6),
  sync_progress_pct integer not null default 0,
  sync_detail text,
  sync_error text,
  applied_at timestamptz not null default now(),
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table activity_log (
  id serial primary key,
  application_id integer references loan_applications(id) on delete cascade,
  officer_name text,
  action text not null,
  message text,
  tier text,
  score integer,
  created_at timestamptz not null default now()
);

create index idx_loan_applications_status on loan_applications(status);
create index idx_loan_applications_tier on loan_applications(tier);
create index idx_loan_applications_region on loan_applications(region);
create index idx_activity_log_created_at on activity_log(created_at desc);
create index idx_products_scoring_config on products(scoring_config_id);
create index idx_scoring_groups_config on scoring_groups(config_id);
create index idx_scoring_fields_group on scoring_fields(group_id);
