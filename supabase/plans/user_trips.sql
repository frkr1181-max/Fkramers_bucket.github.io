-- DESIGN PROPOSAL ONLY: review this schema before creating a migration.
-- Trip records are optional account saves; guest plans never reach this table.
CREATE TABLE public.user_trips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination_slug text NOT NULL REFERENCES public.destinations(slug) ON DELETE RESTRICT,
    trip_name text CHECK (trip_name IS NULL OR length(btrim(trip_name)) BETWEEN 1 AND 80),
    trip_purpose text NOT NULL DEFAULT 'tourism'
        CHECK (trip_purpose IN ('tourism', 'business', 'study', 'work', 'family', 'long-term', 'transit')),
    start_date date,
    end_date date,
    estimated_duration_value integer CHECK (estimated_duration_value IS NULL OR estimated_duration_value > 0),
    estimated_duration_unit text
        CHECK (estimated_duration_unit IS NULL OR estimated_duration_unit IN ('day', 'week', 'month', 'year')),
    travel_experience text
        CHECK (travel_experience IS NULL OR travel_experience IN ('first-solo', 'some')),
    completed_checklist jsonb NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(completed_checklist) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_trips_valid_date_range CHECK (
        end_date IS NULL OR (start_date IS NOT NULL AND end_date > start_date)
    ),
    CONSTRAINT user_trips_duration_pair CHECK (
        (estimated_duration_value IS NULL) = (estimated_duration_unit IS NULL)
    ),
    CONSTRAINT user_trips_no_exact_and_estimated_end CHECK (
        end_date IS NULL OR estimated_duration_value IS NULL
    )
);

CREATE INDEX user_trips_owner_updated_idx ON public.user_trips (owner_id, updated_at DESC);

ALTER TABLE public.user_trips ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_trips FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_trips TO authenticated;

CREATE POLICY user_trips_select_own ON public.user_trips
    FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
CREATE POLICY user_trips_insert_own ON public.user_trips
    FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY user_trips_update_own ON public.user_trips
    FOR UPDATE TO authenticated
    USING (owner_id = (SELECT auth.uid()))
    WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY user_trips_delete_own ON public.user_trips
    FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));
