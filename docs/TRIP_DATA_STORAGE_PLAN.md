# Saved trip and offline guide plan

<<<<<<< Updated upstream
This document describes account-owned trip storage. Owner-scoped FastAPI trip CRUD is implemented. The [alignment migration](../supabase/migrations/20261105231649_align_user_trips_with_planner.sql) was applied on November 5, 2026 after inspection found that the hosted table still used an older exact-date design despite its migration history. The alignment adds estimate, experience, and checklist fields while preserving ownership policies and existing columns. Frontend implementation and interaction decisions await the final design plan. The product behavior and offline sections below describe earlier planning requirements, not implemented frontend features.
=======
This document describes the optional account path. Guests can browse country research and prepare a temporary trip without signing in; guest trip details stay in memory and clear on refresh. The proposed SQL in `supabase/plans/user_trips.sql` is not a migration and has not been applied to Supabase.
>>>>>>> Stashed changes

## Product behavior

- Public guide pages show only active destinations and published travel facts. Supabase RLS controls anonymous reads; draft candidates remain private.
- A guest can create a temporary guide view. Do not write guest trips or checklist state to Supabase, local storage, or IndexedDB.
- A signed-in user can save a trip to their profile. Trip rows are owner-only.
- After a signed-in user saves or opens a trip online, cache that trip's profile, general checklist progress, and the currently approved guide content on that device for offline viewing. Keep source title, URL, and checked date in the cached content. External source links require a connection to open.
- Sign-in and first sync require a connection. Offline access is for a trip already saved and synced on that device; do not imply Supabase itself provides offline access.
- The checklist is a general preparation checklist for all countries and trip types. It should not contain flight bookings, lodging tasks, or city itinerary steps. Checklist progress may sync as part of the saved trip, but the generic task definitions belong to the app.

## Fields to save

<<<<<<< Updated upstream
The migration matches the current planner's flexible timing and seven trip purposes:

| Field | Required | Notes |
| --- | --- | --- |
| `destination_slug` | Yes | Stable key for a country in `public.destinations`. |
| `trip_purpose` | Yes | Defaults to `tourism`; allowed values are `tourism`, `business`, `study`, `work`, `family`, `long-term`, and `transit`. |
| `start_date`, `end_date` | No | Exact dates are optional. If an end date is set, a start date is required and the end cannot be earlier (same-day trips are supported). |
| `estimated_duration_value`, `estimated_duration_unit` | No | Positive value and one of `day`, `week`, `month`, or `year`; stored as a pair. An estimate can include a start date, but not an exact end date. |
| `travel_experience` | No | Optional `first-solo` or `some` value from the current form. |
| `completed_checklist` | No | JSON object keyed by stable task IDs. The backend supports saved progress; frontend integration remains pending. Guest progress is never persisted. |
| `trip_name` | No | Optional label up to 80 characters. The current API does not accept or edit descriptions; an older hosted description column is preserved. |
| `owner_id` | Derived | Supabase Auth user ID; the server must derive it from the validated session. |
=======
Match the account record to the current trip form; do not use the earlier upstream proposal unchanged.

| Field | Required | Notes |
| --- | --- | --- |
| `destination_slug` | Yes | Stable key for an active country in `public.destinations`. |
| `trip_purpose` | Yes | Defaults to `tourism`; allowed values are `tourism`, `business`, `study`, `work`, `family`, `long-term`, and `transit`. |
| `start_date`, `end_date` | No | Store exact dates together; if `end_date` is set, require `start_date` and an end after the start. |
| `estimated_duration_value`, `estimated_duration_unit` | No | Store a positive number and one of `day`, `week`, `month`, or `year`; save as a pair. Can accompany a start date but not an exact end date. |
| `travel_experience` | No | The current form has `first-solo` and `some`; keep only while that question remains in the product. |
| `completed_checklist` | No | Object keyed by stable task IDs; account-saved progress can sync across devices. Never persist guest progress. |
| `trip_name` | No | Optional label can be added if the team keeps the name field from the mid-fidelity screen. Avoid free-text trip descriptions for this research-only product. |
>>>>>>> Stashed changes

Do not collect passport numbers, health details, precise locations, booking confirmations, or itinerary content in the trip row.

## Account storage and access

<<<<<<< Updated upstream
`public.user_trips` has one row per saved trip. The migration links `owner_id` to `auth.users(id)`, references the destination catalog, and defines owner-only select/insert/update/delete policies. Derive `owner_id` from the validated session; ignore any owner ID supplied by the browser. Never use a service-role key for user trip CRUD.

Trip CRUD routes are implemented in the existing FastAPI application under `app/`. They require a Supabase access token and use the publishable key plus that token for PostgREST calls so RLS enforces ownership. The `/api/destinations` and `/api/destinations/{slug}/facts` routes are public reads and must use the publishable key without a user bearer token, allowing Supabase's `anon` RLS policies to apply. The service-role key stays server-side for trusted collection/import tasks only.

Email and password belong to Supabase Auth. Trip rows reference `auth.users(id)` through `owner_id`; they do not duplicate account email or password hashes. `/api/auth/me` returns the validated account's ID and email. Trip payloads reject credentials and client-supplied ownership. Session storage and frontend integration will be addressed with the final design plan.

The backend exposes `GET/POST /api/trips` and `GET/PUT/DELETE /api/trips/{trip_id}`. `PUT` replaces the editable trip fields. Requests require a validated bearer token. Missing or inaccessible trips return `404`; invalid trip fields return `422`. The backend derives ownership from the authenticated account and passes its token to Supabase so RLS remains active.

## Offline copy (planned)
=======
`public.user_trips` has one row per saved trip. The schema proposal includes an `owner_id` tied to `auth.users(id)`, a foreign key to the destination catalog, date or estimated-duration fields, purpose, and checklist progress. RLS must limit select, insert, update, and delete to the signed-in user's `auth.uid()`. Derive `owner_id` from the validated session; ignore any owner ID supplied by the browser. Never use a service-role key for user trip CRUD.

Trip CRUD routes belong in the existing FastAPI application under `app/`. They require a Supabase access token and use the publishable key plus that token for PostgREST calls so RLS enforces ownership. The `/api/destinations` and `/api/destinations/{slug}/facts` routes are public reads and must use the publishable key without a user bearer token, allowing Supabase's `anon` RLS policies to apply. The service-role key stays server-side for trusted collection/import tasks only.

## Offline copy
>>>>>>> Stashed changes

Use a local IndexedDB cache for account-saved trip data and its approved guide snapshot. Cache the fact text, source metadata, verification dates, and checklist state. Update it when the trip is opened or refreshed online. Show that the guide is a saved copy with its last checked date. A stale cache must not look like a live alert or current forecast; dynamic information needs a separate clear freshness label. Do not cache unreviewed source candidates.

## Implementation sequence

1. Keep the current guest flow memory-only and connect it to the public, RLS-limited guide API.
<<<<<<< Updated upstream
2. Connect sign-up/sign-in to optional account saving, using the existing `user_trips` table after confirming its migration is recorded in the target project.
3. Complete: owner-scoped FastAPI create/list/read/update/delete routes use the authenticated user's token and publishable key.
4. Add a local offline cache for signed-in saved trips and approved guide snapshots; keep account data isolated by the active user and clear it on sign-out as appropriate.
5. Verify anonymous users can read only active destinations and published facts; verify two accounts cannot access each other's trips; verify guest data disappears on refresh; verify saved guide pages work offline after a successful online sync.
=======
2. Align sign-up/sign-in with optional account saving; add a `user_trips` migration only after the team approves the field list and confirms migration history.
3. Add owner-scoped FastAPI create/list/read/update/delete routes using the authenticated user's token, not the service-role helper.
4. Add a local offline cache for signed-in saved trips and approved guide snapshots; keep account data isolated by the active user and clear it on sign-out as appropriate.
5. Verify anonymous users can read only active destinations and published facts; verify two accounts cannot access each other's trips; verify guest data disappears on refresh; verify saved guide pages work offline after a successful online sync.

## GitHub proposal compatibility

The incoming `supabase/plans/user_trips.sql` originally required exact start/end dates and allowed only four purpose values (`leisure`, `work`, `study`, `emergency`), which did not match the current planner. The local SQL proposal now uses the planner's seven purposes and supports optional exact dates or estimated duration. It remains design-only. GitHub also adds a separate Flask folder; the root FastAPI application remains the canonical backend so the repository does not have two competing APIs.
>>>>>>> Stashed changes
