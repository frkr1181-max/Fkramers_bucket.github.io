# RoamReady backend

This folder contains a Flask API connected to the existing RoamReady Supabase project. The code follows the team's beginner-friendly Python style, with an explanatory comment directly under each executable line.

## Connect and run locally

Use Python 3.10 or newer. Run these PowerShell commands from the `Backend` folder.

```powershell
py -m venv .venv
# Create an isolated Python environment for the backend.
.\.venv\Scripts\Activate.ps1
# Activate the environment in PowerShell.
py -m pip install -r requirements.txt
# Install the pinned Flask, Supabase, and environment-loading packages.
Copy-Item .env.example .env
# Create a local settings file that is excluded from Git.
py app.py
# Start the API at http://127.0.0.1:5000.
```

Before starting the API, replace the placeholder in `Backend/.env` with the project's **publishable** key from Supabase Project Settings. Do not use a secret key or the legacy service-role key. The local `.env` file is ignored by Git.

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Checks that the backend can read from Supabase. |
| `GET /api/destinations` | Lists active destination records from Supabase. |
| `GET /api/destinations/{slug}/facts` | Returns published facts and their source links for one active destination. |
| `POST /api/assistant/ask` | Searches published summaries for a question and returns citations, or says it has no verified answer. |

The question route expects a JSON object with `destination_slug` and `question`. It uses simple keyword matching and does not call an AI provider. It will only use published facts with source citations.

## Shared database

The API reads the existing Supabase tables:

- `destinations` holds stable country slugs, names, ISO codes, regions, and research owners.
- `travel_facts` holds travel summaries, official excerpts, verification dates, and source links.
- `source_candidates` holds draft research awaiting review; the public API does not query or expose this table.

The database already had 24 of the 36 destinations and 17 source candidates awaiting review, with no published travel facts. A migration adds the 12 destinations listed in the build document and grants read access only to active destinations and published facts. Row Level Security keeps the draft candidates private. No candidate was approved or published by this update.

The SQL used for the Supabase update is preserved in `Supabase/migrations/202610290001_roamready_public_reads_and_destination_roster.sql`.

## Team handoff

- A destination is the guide the traveler selected; a fact is one specific travel claim; a source is the evidence that supports the claim.
- New facts should remain unpublished until the team confirms the official source, plain-language summary, and last-verified date.
- Changing a candidate's status to approved does not publish it; publication should follow the team's review process and explicit publish action.
- Before deployment, set `ROAMREADY_ALLOWED_ORIGIN` to the website's exact origin and keep database secret keys off the client and out of source control.
- The front-end page is not wired to these endpoints yet; it can request destinations and facts using the routes above.

