-- Store the trip conditions that make a travel claim relevant. A NULL
-- purpose list means the fact applies to every trip purpose; NULL day bounds
-- mean there is no stay-length limit. Bounds are inclusive.

alter table public.source_candidates
  add column min_stay_days integer,
  add column max_stay_days integer,
  add column applies_to_purposes text[],
  add column applicability_status text not null default 'needs_review';

alter table public.source_candidates
  add constraint source_candidates_min_stay_days_check
    check (min_stay_days is null or min_stay_days >= 1),
  add constraint source_candidates_max_stay_days_check
    check (max_stay_days is null or max_stay_days >= 1),
  add constraint source_candidates_stay_bounds_check
    check (min_stay_days is null or max_stay_days is null or max_stay_days >= min_stay_days),
  add constraint source_candidates_purposes_check
    check (applies_to_purposes is null or (
      cardinality(applies_to_purposes) > 0
      and applies_to_purposes <@ array['tourism', 'business', 'study', 'work', 'family', 'long-term', 'transit']::text[]
    )),
  add constraint source_candidates_applicability_status_check
    check (applicability_status in ('needs_review', 'general', 'conditional'));

alter table public.travel_facts
  add column min_stay_days integer,
  add column max_stay_days integer,
  add column applies_to_purposes text[],
  add column applicability_status text not null default 'needs_review';

alter table public.travel_facts
  add constraint travel_facts_min_stay_days_check
    check (min_stay_days is null or min_stay_days >= 1),
  add constraint travel_facts_max_stay_days_check
    check (max_stay_days is null or max_stay_days >= 1),
  add constraint travel_facts_stay_bounds_check
    check (min_stay_days is null or max_stay_days is null or max_stay_days >= min_stay_days),
  add constraint travel_facts_purposes_check
    check (applies_to_purposes is null or (
      cardinality(applies_to_purposes) > 0
      and applies_to_purposes <@ array['tourism', 'business', 'study', 'work', 'family', 'long-term', 'transit']::text[]
    )),
  add constraint travel_facts_applicability_status_check
    check (
      applicability_status in ('needs_review', 'general', 'conditional')
      and (
        applicability_status <> 'general'
        or (min_stay_days is null and max_stay_days is null and applies_to_purposes is null)
      )
      and (
        applicability_status <> 'conditional'
        or min_stay_days is not null or max_stay_days is not null or applies_to_purposes is not null
      )
    );

create index travel_facts_applicability_idx
  on public.travel_facts (destination_slug, category, min_stay_days, max_stay_days)
  where published = true;

comment on column public.source_candidates.min_stay_days is
  'Inclusive minimum trip length in days for this unreviewed source candidate; NULL means no minimum.';
comment on column public.source_candidates.max_stay_days is
  'Inclusive maximum trip length in days for this unreviewed source candidate; NULL means no maximum.';
comment on column public.source_candidates.applies_to_purposes is
  'Trip purposes this candidate applies to; NULL means all purposes.';
comment on column public.source_candidates.applicability_status is
  'Whether applicability has been reviewed; facts marked needs_review must not be displayed.';
comment on column public.travel_facts.min_stay_days is
  'Inclusive minimum trip length in days for this reviewed fact; NULL means no minimum.';
comment on column public.travel_facts.max_stay_days is
  'Inclusive maximum trip length in days for this reviewed fact; NULL means no maximum.';
comment on column public.travel_facts.applies_to_purposes is
  'Trip purposes this reviewed fact applies to; NULL means all purposes.';
comment on column public.travel_facts.applicability_status is
  'Applicability review state; only general or conditional facts may be returned to travelers.';
