# Saved trip and offline guide plan

This document describes the optional account path. Guests can browse country research and prepare a temporary trip without signing in; guest trip details stay in page memory and clear on refresh. GitHub's current build notes say the owner-scoped schema in [migration 20261029225934_user_trips.sql](../supabase/migrations/20261029225934_user_trips.sql) has been applied. Confirm the target project's migration history before attempting to apply it again. The FastAPI trip routes and frontend persistence still need implementation; the table does not mean trips can already be saved through the app.

## Product behavior

- Public guide pages show only active destinations and published travel facts. Supabase RLS controls anonymous reads; draft candidates remain private.
- A guest can create a temporary guide view. Do not write guest trips or checklist state to Supabase, local storage, or IndexedDB.
- A signed-in user can save a trip to their profile. Trip rows are owner-only.
- After a signed-in user saves or opens a trip online, cache that trip's profile, general checklist progress, and the currently approved guide content on that device for offline viewing. Keep source title, URL, and checked date in the cached content. External source links require a connection to open.
- Sign-in and first sync require a connection. Offline access is for a trip already saved and synced on that device; do not imply Supabase itself provides offline access.
- The checklist is a general preparation checklist for all countries and trip types. It should not contain flight bookings, lodging tasks, or city itinerary steps. Checklist progress may sync as part of the saved trip, but the generic task definitions belong to the app.

## Fields to save

The migration matches the current planner's flexible timing and seven trip purposes:

| Field | Required | Notes |
| --- | --- | --- |
| `destination_slug` | Yes | Stable key for a country in `public.destinations`. |
| `trip_purpose` | Yes | Defaults to `tourism`; allowed values are `tourism`, `business`, `study`, `work`, `family`, `long-term`, and `transit`. |
| `start_date`, `end_date` | No | Exact dates are optional. If an end date is set, a start date is required and the end must be later. |
| `estimated_duration_value`, `estimated_duration_unit` | No | Positive value and one of `day`, `week`, `month`, or `year`; stored as a pair. An estimate can include a start date, but not an exact end date. |
| `travel_experience` | No | Optional `first-solo` or `some` value from the current form. |
| `completed_checklist` | No | JSON object keyed by stable task IDs. The schema supports saved progress; the app still needs to implement syncing. Guest progress is never persisted. |
| `trip_name` | No | Optional label up to 80 characters. The schema does not store a trip description. |
| `owner_id` | Derived | Supabase Auth user ID; the server must derive it from the validated session. |

Do not collect passport numbers, health details, precise locations, booking confirmations, or itinerary content in the trip row.

## Account storage and access

`public.user_trips` has one row per saved trip. The migration links `owner_id` to `auth.users(id)`, references the destination catalog, and defines owner-only select/insert/update/delete policies. Derive `owner_id` from the validated session; ignore any owner ID supplied by the browser. Never use a service-role key for user trip CRUD.

Trip CRUD routes belong in the existing FastAPI application under `app/`. They require a Supabase access token and use the publishable key plus that token for PostgREST calls so RLS enforces ownership. The `/api/destinations` and `/api/destinations/{slug}/facts` routes are public reads and must use the publishable key without a user bearer token, allowing Supabase's `anon` RLS policies to apply. The service-role key stays server-side for trusted collection/import tasks only.

## Offline copy

Use a local IndexedDB cache for account-saved trip data and its approved guide snapshot. Cache the fact text, source metadata, verification dates, and checklist state. Update it when the trip is opened or refreshed online. Show that the guide is a saved copy with its last checked date. A stale cache must not look like a live alert or current forecast; dynamic information needs a separate clear freshness label. Do not cache unreviewed source candidates.

## Implementation sequence

1. Keep the current guest flow memory-only and connect it to the public, RLS-limited guide API.
2. Connect sign-up/sign-in to optional account saving, using the existing `user_trips` table after confirming its migration is recorded in the target project.
3. Add owner-scoped FastAPI create/list/read/update/delete routes using the authenticated user's token, not the service-role helper.
4. Add a local offline cache for signed-in saved trips and approved guide snapshots; keep account data isolated by the active user and clear it on sign-out as appropriate.
5. Verify anonymous users can read only active destinations and published facts; verify two accounts cannot access each other's trips; verify guest data disappears on refresh; verify saved guide pages work offline after a successful online sync.
