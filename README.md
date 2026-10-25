# RoamReady

Senior capstone project for source-grounded travel information.

## Backend setup

The backend is a FastAPI application connected to the RoamReady Supabase project's Auth and Postgres services. The country catalog, source-review queue, and published facts live in Supabase. Destination and fact routes require a registered Supabase user. Scraped source material enters a private review queue and is never returned as traveler guidance. Backend code is grouped by responsibility: `app/api/routes/` contains HTTP routes, `app/schemas/` defines response shapes, `app/repositories/` owns Supabase reads, and `app/core/` loads settings.

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

Open `http://127.0.0.1:5500`. The current screen flow is a session-only mock; Auth and API data integration are scheduled work, and country guides intentionally contain no travel claims until sources are reviewed. See [the two-week prototype plan](docs/PROTOTYPE_PLAN.md) for the scope, backend data model, owners, and dated schedule.

### Source collection

The source monitor polls five approved GOV.UK FCDO Content API pages daily, checks `robots.txt`, fingerprints each section, and saves new content versions to the private review queue. Candidate material is never published automatically. See [collector setup and source rules](collectors/README.md).

### Initial endpoints

- `GET /api/health` checks that the API is running.
- `GET /api/auth/me` returns the current user's ID and email.
- `GET /api/destinations` lists the 24 research countries (authenticated).
- `GET /api/destinations/{destination_slug}/facts?category=entry` returns published Supabase facts for a country (authenticated; category is optional).

### Authentication flow

The client signs users in directly with Supabase Auth (for example, with `supabase.auth.signInWithPassword({ email, password })` in `supabase-js`). It sends the returned `session.access_token` on protected API requests:

```http
Authorization: Bearer <access-token>
```

The FastAPI dependency validates the token with Supabase Auth's `/auth/v1/user` endpoint on each protected request. Invalid or expired tokens receive `401`; anonymous sessions receive `403`; missing server configuration or an unavailable Auth service receives `503`. The health endpoint remains public. Server-side data reads use `SUPABASE_SERVICE_ROLE_KEY` only after Auth validation; keep it in the backend's local `.env` and never place it in frontend code or commit it.

Copy `.env.example` to `.env` for local development. `.env` is ignored by Git. Set `SUPABASE_SERVICE_ROLE_KEY` from the Supabase project API settings for local backend and collector use. Configure email/password and any desired confirmation behavior in the Supabase project's Auth settings. The prototype UI still needs its sign-in flow connected to Supabase Auth before end-to-end use.

Do not commit `.env` files or credentials. Add environment-variable names to `.env.example` when the app needs configuration. Database schema is versioned in `supabase/migrations/`.

### Scraper-to-Supabase workflow

1. `python -m collectors.govuk_fcdo --source-id govuk-fcdo-japan` writes local source candidates for one configured source.
2. `python -m collectors.import_candidates data/candidates/govuk-fcdo-japan.json` puts them in the private `source_candidates` review queue.
3. A teammate reviews the source in Supabase and writes traveler-facing, verified material as a separate `travel_facts` row with `destination_slug`, citations, and `published = true`.
4. A signed-in client sends its Supabase access token to FastAPI. FastAPI validates it, then reads only published rows using its server-only key.

The country catalog, fact table, and candidate table have RLS enabled with no client policies or grants to `anon` and `authenticated`. FastAPI reads with its server-only key only after validating Auth. Schema: [initial migration](supabase/migrations/20261022224810_source_review_and_travel_facts.sql) and [country catalog migration](supabase/migrations/20261025233333_country_catalog_and_backend.sql).
