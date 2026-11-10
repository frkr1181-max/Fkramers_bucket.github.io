-- Align the older hosted table with the planner schema already recorded in Git.
-- Existing trip rows, descriptions, ownership policies, and grants are preserved.
ALTER TABLE public.user_trips
    ALTER COLUMN start_date DROP NOT NULL,
    ALTER COLUMN end_date DROP NOT NULL,
    ALTER COLUMN trip_purpose SET DEFAULT 'tourism',
    ADD COLUMN IF NOT EXISTS estimated_duration_value integer,
    ADD COLUMN IF NOT EXISTS estimated_duration_unit text,
    ADD COLUMN IF NOT EXISTS travel_experience text,
    ADD COLUMN IF NOT EXISTS completed_checklist jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Keep legacy purpose values readable without changing their meaning.
ALTER TABLE public.user_trips DROP CONSTRAINT IF EXISTS user_trips_trip_purpose_check;
ALTER TABLE public.user_trips ADD CONSTRAINT user_trips_trip_purpose_check
    CHECK (trip_purpose IN ('tourism', 'business', 'study', 'work', 'family', 'long-term', 'transit', 'leisure', 'emergency'));

ALTER TABLE public.user_trips DROP CONSTRAINT IF EXISTS user_trips_valid_dates;
ALTER TABLE public.user_trips DROP CONSTRAINT IF EXISTS user_trips_valid_date_range;
ALTER TABLE public.user_trips ADD CONSTRAINT user_trips_valid_date_range
    CHECK (end_date IS NULL OR (start_date IS NOT NULL AND end_date >= start_date));

ALTER TABLE public.user_trips DROP CONSTRAINT IF EXISTS user_trips_duration_pair;
ALTER TABLE public.user_trips ADD CONSTRAINT user_trips_duration_pair
    CHECK ((estimated_duration_value IS NULL) = (estimated_duration_unit IS NULL));
ALTER TABLE public.user_trips DROP CONSTRAINT IF EXISTS user_trips_no_exact_and_estimated_end;
ALTER TABLE public.user_trips ADD CONSTRAINT user_trips_no_exact_and_estimated_end
    CHECK (end_date IS NULL OR estimated_duration_value IS NULL);

-- Named separately so this also applies cleanly after the canonical fresh-install migration.
ALTER TABLE public.user_trips ADD CONSTRAINT user_trips_planner_duration_value
    CHECK (estimated_duration_value IS NULL OR estimated_duration_value > 0);
ALTER TABLE public.user_trips ADD CONSTRAINT user_trips_planner_duration_unit
    CHECK (estimated_duration_unit IS NULL OR estimated_duration_unit IN ('day', 'week', 'month', 'year'));
ALTER TABLE public.user_trips ADD CONSTRAINT user_trips_planner_experience
    CHECK (travel_experience IS NULL OR travel_experience IN ('first-solo', 'some'));
ALTER TABLE public.user_trips ADD CONSTRAINT user_trips_planner_checklist
    CHECK (jsonb_typeof(completed_checklist) = 'object');

CREATE INDEX IF NOT EXISTS user_trips_owner_updated_idx ON public.user_trips (owner_id, updated_at DESC);
