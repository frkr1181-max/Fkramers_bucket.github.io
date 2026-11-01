# RoamReady

Senior capstone project for source-grounded travel information.

## Backend setup

The canonical backend is the FastAPI application in `app/`, connected to the RoamReady Supabase project's Auth and Postgres services. Public destination and published-fact reads use the publishable key and RLS; account and trip operations require a signed-in user. Scraped source material enters a private review queue and is never returned as traveler guidance. The separate `Backend/` Flask folder is an experimental read-only example; do not run it as a second canonical API. FastAPI code is grouped by responsibility: `app/api/routes/` contains HTTP routes, `app/schemas/` defines response shapes, `app/repositories/` owns Supabase reads, and `app/core/` loads settings.

### Run locally

Requires Python 3.10 or newer.

```bash
python3 -m venv .venv
# Create a separate Python environment for this project.
source .venv/bin/activate
# Activate that environment in the current terminal session.
python -m pip install -r requirements.txt
# Install the FastAPI dependency listed for the project.
cp -n .env.example .env
# Configure the Supabase project URL and publishable key for local development.
fastapi dev app/main.py
# Start the local API server with automatic reload while you edit.
```

Open `http://127.0.0.1:8000/docs` for interactive API documentation.

### Frontend prototype

The prototype scaffold uses browser-native HTML, CSS, and JavaScript, so it has no frontend package install step. Start it in a second terminal:

```bash
python3 -m http.server 5500 --directory frontend
```

Open `http://127.0.0.1:5500`. The current flow is a guest preparation prototype: trip details clear on refresh, the checklist uses general preparation items, and the country guide is still a placeholder. Supabase sign-in, account trip saving, live guide data, and offline saved guides are not connected yet. See [the two-week prototype plan](docs/PROTOTYPE_PLAN.md) for product scope and backend requirements.

The account-owned trip storage workflow, field validation, Supabase RLS policy design, and security acceptance checks are documented in [the trip data storage plan](docs/TRIP_DATA_STORAGE_PLAN.md). The `user_trips` schema is applied in [its Supabase migration](supabase/migrations/20261029225934_user_trips.sql); FastAPI trip routes and front-end persistence remain to be implemented.

### Source collection

The source monitor polls five approved GOV.UK FCDO Content API pages daily, checks `robots.txt`, fingerprints each section, and saves new content versions to the private review queue. Candidate material is never published automatically. See [collector setup and source rules](collectors/README.md).

### Initial endpoints

- `GET /api/health` checks that the API is running.
- `GET /api/auth/me` returns the current user's ID and email.
- `GET /api/destinations` lists active research countries (public; RLS-limited).
- `GET /api/destinations/{destination_slug}/facts?category=entry&stay_days_min=1&stay_days_max=90&purpose=tourism` returns published facts relevant to a short tourism trip (public; RLS-limited; filters are optional, and conditional facts are hidden when trip details are missing).
- Fact rows must be marked `general` or `conditional` after a reviewer checks their purpose and stay-length limits. Facts marked `needs_review` are never returned. Use inclusive `min_stay_days` / `max_stay_days` limits and `applies_to_purposes` to record the source's conditions.

### Authentication flow

The client signs users in directly with Supabase Auth (for example, with `supabase.auth.signInWithPassword({ email, password })` in `supabase-js`). It sends the returned `session.access_token` on protected API requests:

```http
Authorization: Bearer <access-token>
```

The FastAPI dependency validates the token with Supabase Auth's `/auth/v1/user` endpoint on each protected request. Invalid or expired tokens receive `401`; missing server configuration or an unavailable Auth service receives `503`. The health endpoint and RLS-limited guide reads are public. Guide reads use the publishable key so anonymous RLS policies apply. Keep `SUPABASE_SERVICE_ROLE_KEY` in the backend's local `.env` for trusted collector/import operations only; never place it in frontend code or commit it.

Copy `.env.example` to `.env` for local development. `.env` is ignored by Git. Set `SUPABASE_SERVICE_ROLE_KEY` from the Supabase project API settings for local backend and collector use. Configure email/password and any desired confirmation behavior in the Supabase project's Auth settings. The prototype UI still needs its sign-in flow connected to Supabase Auth before end-to-end use.

Do not commit `.env` files or credentials. Add environment-variable names to `.env.example` when the app needs configuration. Database schema is versioned in `supabase/migrations/`.

### Scraper-to-Supabase workflow

1. `python -m collectors.govuk_fcdo --source-id govuk-fcdo-japan` writes local source candidates for one configured source.
2. `python -m collectors.import_candidates data/candidates/govuk-fcdo-japan.json` puts them in the private `source_candidates` review queue.
3. A teammate reviews the source in Supabase and writes traveler-facing, verified material as a separate `travel_facts` row with `destination_slug`, citations, and `published = true`.
4. Guests can read only published rows through the public guide API under RLS. Importing candidates remains a trusted backend operation and never uses a browser key to write review data.

The country catalog, fact table, and candidate table have RLS enabled. The GitHub public-read migration grants `anon` select access only to active destinations and published facts; `source_candidates` remains private. FastAPI uses the publishable key for guide reads. Schema: [initial migration](supabase/migrations/20261022224810_source_review_and_travel_facts.sql), [country catalog migration](supabase/migrations/20261025233333_country_catalog_and_backend.sql), and [public-read migration](supabase/migrations/202610290001_roamready_public_reads_and_destination_roster.sql).
