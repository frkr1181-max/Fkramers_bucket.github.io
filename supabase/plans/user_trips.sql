-- DESIGN PROPOSAL ONLY: this file is not in supabase/migrations and has not been applied to the live project.
CREATE TABLE public.user_trips (
-- Create one saved trip record for each trip a signed-in user plans.
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
-- Give each trip a stable identifier that the API can use for edits and retrieval.
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
-- Link the trip to its Supabase Auth account and remove it when that account is deleted.
    destination_slug text NOT NULL REFERENCES public.destinations(slug) ON DELETE RESTRICT,
-- Link the trip to a country already present in the shared destination catalog.
    start_date date NOT NULL,
-- Store the first day of the user's travel dates.
    end_date date NOT NULL,
-- Store the last day of the user's travel dates.
    trip_purpose text NOT NULL CHECK (trip_purpose IN ('leisure', 'work', 'study', 'emergency')),
-- Restrict the saved purpose to the four choices shown in the prototype screenshot.
    trip_name text CHECK (trip_name IS NULL OR length(btrim(trip_name)) BETWEEN 1 AND 80),
-- Keep the optional trip label short and reject whitespace-only names.
    trip_description text CHECK (trip_description IS NULL OR length(btrim(trip_description)) BETWEEN 1 AND 1000),
-- Keep the optional free-text description within a modest length limit.
    created_at timestamptz NOT NULL DEFAULT now(),
-- Record when the user first saved the trip.
    updated_at timestamptz NOT NULL DEFAULT now(),
-- Record when the backend last saved an edit to the trip.
    CONSTRAINT user_trips_valid_dates CHECK (end_date >= start_date)
-- Prevent a trip from ending before it starts.
);
-- Finish creating the proposed user-owned trip table.
CREATE INDEX user_trips_owner_updated_idx ON public.user_trips (owner_id, updated_at DESC);
-- Make it efficient to list one user's trips from newest update to oldest.
ALTER TABLE public.user_trips ENABLE ROW LEVEL SECURITY;
-- Require row policies for all access to this public-schema table.
REVOKE ALL ON TABLE public.user_trips FROM anon, authenticated;
-- Start with no client access before granting only the authenticated operations below.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_trips TO authenticated;
-- Give signed-in users the table operations needed by the trip workflow.
CREATE POLICY user_trips_select_own ON public.user_trips FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
-- Allow a signed-in user to read only trips linked to their own Auth ID.
CREATE POLICY user_trips_insert_own ON public.user_trips FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()));
-- Allow inserts only when the new row belongs to the signed-in user.
CREATE POLICY user_trips_update_own ON public.user_trips FOR UPDATE TO authenticated USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));
-- Require both the old and new row to stay owned by the signed-in user during an edit.
CREATE POLICY user_trips_delete_own ON public.user_trips FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));
-- Allow a signed-in user to delete only trips linked to their own Auth ID.
