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

### Main frontend

David's high-fidelity website in `site/` is the only active frontend. It was imported from `hifi-site` commit `c2be951551535550401c585afd084f4e0ad69c6a`. Older prototypes are preserved under `.archive/` and are not served. The independent `experimental-copy/` on David's branch remains his experiment.

Start the FastAPI app above and open `http://127.0.0.1:8000/`. The website and API share one address. Home → Continue as guest → Plan a trip → My trip → Guide loads published facts with trip purpose and inclusive stay length, citations, verification dates, loading states, and empty states. When the API is unreachable, guide browsing uses an explicitly labeled saved snapshot; Retry live guide reconnects. Account operations always require the live API.

Log in or create an account, then choose Save trip on the dashboard. Saved trips can be reopened, updated, or deleted from Your profile. Refresh restores the account session and saved checklist from the API. The optional trip description remains in memory and is labeled as not saved. The trip API accepts only its defined fields and determines ownership from the validated signed-in user.

Deployment preparation and acceptance steps are in [the Render guide](docs/DEPLOYMENT.md). `render.yaml` runs the site and API together; no service-role key is needed by the web service. A deployment has not been created by adding these files.

### Source collection

The source monitor polls five approved GOV.UK FCDO Content API pages daily, checks `robots.txt`, fingerprints each section, and saves new content versions to the private review queue. Candidate material is never published automatically. See [collector setup and source rules](collectors/README.md).

### Country guides

The [country guide index](docs/research/country-guides/README.md) links all 24 destinations in the same ten-section format as Japan. The original guides organize 263 published facts. Subsequent Japan additions and the [twelve-country publication](docs/research/publication-2026-11-10-missing-countries/README.md) bring the saved collection to 575 facts across all 36 dropdown destinations. Facts retain sources, checked dates, and trip conditions.

### Initial endpoints

- `GET /api/health` checks that the API is running.
- `GET /api/auth/config` returns only the public Supabase URL and publishable key for a future Auth client.
- `GET /api/auth/me` returns the current user's ID and email.
- `GET/POST /api/trips` lists or creates the signed-in user's trips.
- `GET/PUT/DELETE /api/trips/{trip_id}` reads, replaces editable fields, or deletes an owned trip. `PUT` accepts the full trip payload. Unknown fields, including client-supplied identity or credentials, are rejected.
- `GET /api/destinations` lists active research countries (public; RLS-limited).
- `GET /api/destinations/{destination_slug}/facts?category=entry&stay_days_min=1&stay_days_max=90&purpose=tourism` returns published facts relevant to a short tourism trip (public; RLS-limited; filters are optional, and conditional facts are hidden when trip details are missing).
- Fact rows must be marked `general` or `conditional` after a reviewer checks their purpose and stay-length limits. Facts marked `needs_review` are never returned. Use inclusive `min_stay_days` / `max_stay_days` limits and `applies_to_purposes` to record the source's conditions.

### Authentication flow

The client signs users in directly with Supabase Auth (for example, with `supabase.auth.signInWithPassword({ email, password })` in `supabase-js`). It sends the returned `session.access_token` on protected API requests:

```http
Authorization: Bearer <access-token>
```

The FastAPI dependency validates the token with Supabase Auth's `/auth/v1/user` endpoint on each protected request. Invalid or expired tokens receive `401`; missing server configuration or an unavailable Auth service receives `503`. The health endpoint and RLS-limited guide reads are public. Guide reads use the publishable key so anonymous RLS policies apply. Keep `SUPABASE_SERVICE_ROLE_KEY` in the backend's local `.env` for trusted collector/import operations only; never place it in frontend code or commit it.

Copy `.env.example` to `.env` for local development. `.env` is ignored by Git. Set `SUPABASE_SERVICE_ROLE_KEY` from the Supabase project API settings for local backend and collector use. Configure email/password and any desired confirmation behavior in the Supabase project's Auth settings. The main website signs in directly with Supabase Auth and sends the returned access token to the trip API.

Do not commit `.env` files or credentials. Add environment-variable names to `.env.example` when the app needs configuration. Database schema is versioned in `supabase/migrations/`.

### Scraper-to-Supabase workflow

1. `python -m collectors.govuk_fcdo --source-id govuk-fcdo-japan` writes local source candidates for one configured source.
2. `python -m collectors.import_candidates data/candidates/govuk-fcdo-japan.json` puts them in the private `source_candidates` review queue.
3. A teammate reviews the source in Supabase and writes traveler-facing, verified material as a separate `travel_facts` row with `destination_slug`, citations, and `published = true`.
4. Guests can read only published rows through the public guide API under RLS. Importing candidates remains a trusted backend operation and never uses a browser key to write review data.

The country catalog, fact table, and candidate table have RLS enabled. The GitHub public-read migration grants `anon` select access only to active destinations and published facts; `source_candidates` remains private. FastAPI uses the publishable key for guide reads. Schema: [initial migration](supabase/migrations/20261022224810_source_review_and_travel_facts.sql), [country catalog migration](supabase/migrations/20261025233333_country_catalog_and_backend.sql), and [public-read migration](supabase/migrations/202610290001_roamready_public_reads_and_destination_roster.sql).

### Backend trip validation

Install `requirements-dev.txt` using Python 3.10+, then run `python -m pytest tests/test_trips.py -q`. The 25 backend checks cover authentication, validation, ownership filters, and use of the user token with the publishable key.

The hosted table's owner CRUD and cross-account isolation were also verified in a rolled-back SQL transaction on November 5, 2026. No test users or trips were retained. Email and password remain in Supabase Auth; trips reference the account through `owner_id`. The main site includes account screens and saved trips; current verification results are recorded in docs/INTEGRATION_VERIFICATION.md.
