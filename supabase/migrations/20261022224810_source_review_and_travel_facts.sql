-- Scraper output stays in a private review queue until a reviewer writes a
-- traveler-facing record to travel_facts and marks it published.
create table public.source_candidates (
  id uuid primary key default gen_random_uuid(),
  candidate_id text not null unique,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  category text not null,
  title text not null,
  candidate_text text not null,
  source jsonb not null,
  status text not null default 'needs_review'
    check (status in ('needs_review', 'approved', 'rejected')),
  collected_at timestamptz not null,
  content_sha256 text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index source_candidates_review_queue_idx
  on public.source_candidates (status, country_code, category);

create table public.travel_facts (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  category text not null,
  title text not null,
  plain_summary text not null,
  official_text_excerpt text,
  last_verified_at date not null,
  sources jsonb not null default '[]'::jsonb
    check (case when jsonb_typeof(sources) = 'array'
      then jsonb_array_length(sources) > 0 else false end),
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index travel_facts_published_destination_idx
  on public.travel_facts (country_code, category)
  where published = true;

alter table public.source_candidates enable row level security;
alter table public.travel_facts enable row level security;

-- No client-facing policies are created. The FastAPI server uses its
-- server-only service role key after validating a Supabase Auth user.
revoke all on public.source_candidates from anon, authenticated;
revoke all on public.travel_facts from anon, authenticated;
