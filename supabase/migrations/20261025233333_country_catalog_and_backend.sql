-- RoamReady destination catalog. Slugs distinguish England and Scotland,
-- which share the ISO alpha-2 code GB but need separate research guides.
create table public.destinations (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique,
  iso_alpha2 text check (iso_alpha2 is null or iso_alpha2 ~ '^[A-Z]{2}$'),
  region text not null,
  research_owner text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.destinations (slug, name, iso_alpha2, region, research_owner) values
  ('south-korea', 'South Korea', 'KR', 'Asia', 'Aahana'),
  ('mexico', 'Mexico', 'MX', 'North America', 'Aahana'),
  ('netherlands', 'Netherlands', 'NL', 'Europe', 'Aahana'),
  ('new-zealand', 'New Zealand', 'NZ', 'Oceania', 'Aahana'),
  ('norway', 'Norway', 'NO', 'Europe', 'Aahana'),
  ('panama', 'Panama', 'PA', 'North America', 'Aahana'),
  ('paraguay', 'Paraguay', 'PY', 'South America', 'David'),
  ('qatar', 'Qatar', 'QA', 'Asia', 'David'),
  ('saudi-arabia', 'Saudi Arabia', 'SA', 'Asia', 'David'),
  ('japan', 'Japan', 'JP', 'Asia', 'David'),
  ('south-africa', 'South Africa', 'ZA', 'Africa', 'David'),
  ('scotland', 'Scotland', 'GB', 'Europe', 'David'),
  ('algeria', 'Algeria', 'DZ', 'Africa', 'Dion'),
  ('argentina', 'Argentina', 'AR', 'South America', 'Dion'),
  ('australia', 'Australia', 'AU', 'Oceania', 'Dion'),
  ('austria', 'Austria', 'AT', 'Europe', 'Dion'),
  ('belgium', 'Belgium', 'BE', 'Europe', 'Dion'),
  ('bosnia-and-herzegovina', 'Bosnia and Herzegovina', 'BA', 'Europe', 'Dion'),
  ('egypt', 'Egypt', 'EG', 'Africa', 'Hilna'),
  ('england', 'England', 'GB', 'Europe', 'Hilna'),
  ('france', 'France', 'FR', 'Europe', 'Hilna'),
  ('germany', 'Germany', 'DE', 'Europe', 'Hilna'),
  ('iraq', 'Iraq', 'IQ', 'Asia', 'Hilna'),
  ('senegal', 'Senegal', 'SN', 'Africa', 'Hilna')
on conflict (slug) do update set
  name = excluded.name,
  iso_alpha2 = excluded.iso_alpha2,
  region = excluded.region,
  research_owner = excluded.research_owner,
  active = true,
  updated_at = now();

alter table public.source_candidates
  add column destination_slug text references public.destinations(slug) on delete restrict;

alter table public.travel_facts
  add column destination_slug text references public.destinations(slug) on delete restrict;

-- Backfill legacy two-letter records where the mapping is unambiguous. The
-- England/Scotland GB records require an explicit slug when they are added.
update public.source_candidates set destination_slug = case country_code
  when 'DZ' then 'algeria' when 'AR' then 'argentina' when 'AU' then 'australia'
  when 'AT' then 'austria' when 'BE' then 'belgium' when 'BA' then 'bosnia-and-herzegovina'
  when 'EG' then 'egypt' when 'FR' then 'france' when 'DE' then 'germany'
  when 'IQ' then 'iraq' when 'JP' then 'japan' when 'MX' then 'mexico'
  when 'NL' then 'netherlands' when 'NZ' then 'new-zealand' when 'NO' then 'norway'
  when 'PA' then 'panama' when 'PY' then 'paraguay' when 'QA' then 'qatar'
  when 'SA' then 'saudi-arabia' when 'SN' then 'senegal' when 'ZA' then 'south-africa'
  when 'KR' then 'south-korea' else null end;

update public.travel_facts set destination_slug = case country_code
  when 'DZ' then 'algeria' when 'AR' then 'argentina' when 'AU' then 'australia'
  when 'AT' then 'austria' when 'BE' then 'belgium' when 'BA' then 'bosnia-and-herzegovina'
  when 'EG' then 'egypt' when 'FR' then 'france' when 'DE' then 'germany'
  when 'IQ' then 'iraq' when 'JP' then 'japan' when 'MX' then 'mexico'
  when 'NL' then 'netherlands' when 'NZ' then 'new-zealand' when 'NO' then 'norway'
  when 'PA' then 'panama' when 'PY' then 'paraguay' when 'QA' then 'qatar'
  when 'SA' then 'saudi-arabia' when 'SN' then 'senegal' when 'ZA' then 'south-africa'
  when 'KR' then 'south-korea' else null end;

create index source_candidates_destination_review_idx
  on public.source_candidates (destination_slug, status, category);

create index travel_facts_destination_category_idx
  on public.travel_facts (destination_slug, category)
  where published = true;

alter table public.destinations enable row level security;
revoke all on public.destinations from anon, authenticated;
revoke all on public.source_candidates from anon, authenticated;
revoke all on public.travel_facts from anon, authenticated;
grant select on public.destinations to service_role;
grant select on public.source_candidates to service_role;
grant select on public.travel_facts to service_role;

comment on table public.destinations is
  'Country-level guide catalog currently seeded from the four received RoamReady research CSVs.';
comment on column public.destinations.slug is
  'Stable API identifier; used instead of ISO alpha-2 because England and Scotland both use GB.';
comment on column public.source_candidates.destination_slug is
  'Destination guide the unreviewed source candidate belongs to; null for unmapped legacy records.';
comment on column public.travel_facts.destination_slug is
  'Destination guide the reviewed travel fact belongs to; null for unmapped legacy records.';
