-- Skew News initial persistence schema.
-- Run this file in Supabase Dashboard -> SQL Editor before using server data access.

create extension if not exists pgcrypto;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  listing_url text not null unique check (length(btrim(listing_url)) > 0),
  parser_strategy text,
  is_active boolean not null default true,
  logo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  original_url text not null unique check (length(btrim(original_url)) > 0),
  canonical_url text unique check (canonical_url is null or length(btrim(canonical_url)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) > 0),
  image_url text not null check (length(btrim(image_url)) > 0),
  published_at timestamptz not null,
  raw_text text not null check (length(btrim(raw_text)) > 0),
  scraped_at timestamptz not null default timezone('utc', now()),
  analyzed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.article_analyses (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null unique references public.articles(id) on delete restrict,
  summary text not null check (length(btrim(summary)) > 0),
  sentiment_score numeric(4, 3) not null check (sentiment_score between -1 and 1),
  sentiment_label text not null check (sentiment_label in ('positive', 'neutral', 'negative')),
  bias_score numeric(4, 3) not null check (bias_score between -1 and 1),
  bias_label text not null check (bias_label in ('left', 'center', 'right', 'mixed', 'unclear')),
  left_percentage numeric(5, 2) not null check (left_percentage between 0 and 100),
  center_percentage numeric(5, 2) not null check (center_percentage between 0 and 100),
  right_percentage numeric(5, 2) not null check (right_percentage between 0 and 100),
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  framing_notes text not null,
  loaded_terms jsonb not null default '[]'::jsonb check (jsonb_typeof(loaded_terms) = 'array'),
  disclaimer text not null check (length(btrim(disclaimer)) > 0),
  model text not null check (length(btrim(model)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint article_analyses_percentage_total_check
    check (left_percentage + center_percentage + right_percentage = 100)
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  event text not null check (length(btrim(event)) > 0),
  level text not null default 'info' check (level in ('info', 'warning', 'error')),
  message text not null check (length(btrim(message)) > 0),
  source_id uuid references public.sources(id) on delete set null,
  article_id uuid references public.articles(id) on delete set null,
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.oxylabs_schedules (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null unique references public.sources(id) on delete restrict,
  schedule_id text not null unique check (schedule_id ~ '^[0-9]+$'),
  is_enabled boolean not null default true,
  cadence text not null default 'hourly' check (length(btrim(cadence)) > 0),
  state text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.oxylabs_schedule_runs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.oxylabs_schedules(id) on delete restrict,
  oxylabs_run_id text check (oxylabs_run_id is null or oxylabs_run_id ~ '^[0-9]+$'),
  job_id text not null check (job_id ~ '^[0-9]+$'),
  status text not null check (length(btrim(status)) > 0),
  result_status text,
  result_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(result_metadata) = 'object'),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (schedule_id, job_id)
);

create index if not exists articles_source_published_at_idx on public.articles (source_id, published_at desc);
create index if not exists articles_analyzed_at_idx on public.articles (analyzed_at) where analyzed_at is null;
create index if not exists articles_slug_idx on public.articles (slug);
create index if not exists logs_created_at_idx on public.logs (created_at desc);
create index if not exists logs_source_created_at_idx on public.logs (source_id, created_at desc);
create index if not exists oxylabs_schedule_runs_schedule_id_idx on public.oxylabs_schedule_runs (schedule_id, created_at desc);

alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_analyses enable row level security;
alter table public.logs enable row level security;
alter table public.oxylabs_schedules enable row level security;
alter table public.oxylabs_schedule_runs enable row level security;

revoke all on table public.sources from anon, authenticated;
revoke all on table public.articles from anon, authenticated;
revoke all on table public.article_analyses from anon, authenticated;
revoke all on table public.logs from anon, authenticated;
revoke all on table public.oxylabs_schedules from anon, authenticated;
revoke all on table public.oxylabs_schedule_runs from anon, authenticated;
