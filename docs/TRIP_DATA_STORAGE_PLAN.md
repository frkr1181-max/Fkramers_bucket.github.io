> Current implementation: David’s `site/` is the active frontend. Guest guide reads, sign-in, and account trip saving are connected. See [deployment](DEPLOYMENT.md) and [verification](INTEGRATION_VERIFICATION.md). The remaining document records earlier planning context.

# Saved trip and offline guide plan

This document describes account-owned trip storage. Owner-scoped FastAPI trip CRUD is implemented. The [alignment migration](../supabase/migrations/20261105231649_align_user_trips_with_planner.sql) was applied on November 5, 2026 after inspection found that the hosted table still used an older exact-date design despite its migration history. The alignment adds estimate, experience, and checklist fields while preserving ownership policies and existing columns. David’s site/ frontend provides public guides, sign-in and saved trips. The product behavior and offline sections below describe earlier planning requirements, not implemented frontend features.

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
| `start_date`, `end_date` | No | Exact dates are optional. If an end date is set, a start date is required and the end cannot be earlier (same-day trips are supported). |
| `estimated_duration_value`, `estimated_duration_unit` | No | Positive value and one of `day`, `week`, `month`, or `year`; stored as a pair. An estimate can include a start date, but not an exact end date. |
| `travel_experience` | No | Optional `first-solo` or `some` value from the current form. |
| `completed_checklist` | No | JSON object keyed by stable task IDs. The backend supports saved progress; frontend integration remains pending. Guest progress is never persisted. |
| `trip_name` | No | Optional label up to 80 characters. The current API does not accept or edit descriptions; an older hosted description column is preserved. |
| `owner_id` | Derived | Supabase Auth user ID; the server must derive it from the validated session. |

Do not collect passport numbers, health details, precise locations, booking confirmations, or itinerary content in the trip row.

## Account storage and access

`public.user_trips` has one row per saved trip. The migration links `owner_id` to `auth.users(id)`, references the destination catalog, and defines owner-only select/insert/update/delete policies. Derive `owner_id` from the validated session; ignore any owner ID supplied by the browser. Never use a service-role key for user trip CRUD.

Trip CRUD routes are implemented in the existing FastAPI application under `app/`. They require a Supabase access token and use the publishable key plus that token for PostgREST calls so RLS enforces ownership. The `/api/destinations` and `/api/destinations/{slug}/facts` routes are public reads and must use the publishable key without a user bearer token, allowing Supabase's `anon` RLS policies to apply. The service-role key stays server-side for trusted collection/import tasks only.

Email and password belong to Supabase Auth. Trip rows reference `auth.users(id)` through `owner_id`; they do not duplicate account email or password hashes. `/api/auth/me` returns the validated account's ID and email. Trip payloads reject credentials and client-supplied ownership. Session storage and frontend integration will be addressed with the final design plan.

The backend exposes `GET/POST /api/trips` and `GET/PUT/DELETE /api/trips/{trip_id}`. `PUT` replaces the editable trip fields. Requests require a validated bearer token. Missing or inaccessible trips return `404`; invalid trip fields return `422`. The backend derives ownership from the authenticated account and passes its token to Supabase so RLS remains active.

## Offline copy (planned)

Use a local IndexedDB cache for account-saved trip data and its approved guide snapshot. Cache the fact text, source metadata, verification dates, and checklist state. Update it when the trip is opened or refreshed online. Show that the guide is a saved copy with its last checked date. A stale cache must not look like a live alert or current forecast; dynamic information needs a separate clear freshness label. Do not cache unreviewed source candidates.

## Implementation sequence

1. Keep the current guest flow memory-only and connect it to the public, RLS-limited guide API.
2. Connect sign-up/sign-in to optional account saving, using the existing `user_trips` table after confirming its migration is recorded in the target project.
3. Complete: owner-scoped FastAPI create/list/read/update/delete routes use the authenticated user's token and publishable key.
4. Add a local offline cache for signed-in saved trips and approved guide snapshots; keep account data isolated by the active user and clear it on sign-out as appropriate.
5. Verify anonymous users can read only active destinations and published facts; verify two accounts cannot access each other's trips; verify guest data disappears on refresh; verify saved guide pages work offline after a successful online sync.
