# RoamReady backend

This is a small Flask and SQLite API for the RoamReady prototype. Its layout follows the team's class projects: straightforward Python functions, explicit steps, and comments directly below every line of executable code. The API starts with health and destination routes, returns only approved facts with active source links, and provides a basic source-grounded question endpoint.

## Start the backend

Run these commands from the `Backend` folder. Python 3.10 or newer is recommended.

```powershell
py -m venv .venv
# Create a private Python environment for this backend.
\.venv\Scripts\Activate.ps1
# Activate the environment in PowerShell.
py -m pip install -r requirements.txt
# Install Flask into the active environment.
py app.py
# Create the local database and start the API at http://127.0.0.1:5000.
```

The first start creates `Backend/instance/roamready.sqlite3` and inserts the six first-round destinations from the project build guide: Algeria, Brazil, Egypt, South Korea, Paraguay, and Spain. No travel facts are included until the team researches and approves them.

## API routes

| Route | Purpose | Successful response |
| --- | --- | --- |
| `GET /api/health` | Check that the service is running. | Service status and version. |
| `GET /api/destinations` | List pilot destinations. | Destination IDs, names, and country codes. |
| `GET /api/destinations/{id}/facts` | Read approved facts for a destination. | Summaries, verification dates, source records, and a freshness notice. |
| `POST /api/assistant/ask` | Search a destination's approved facts. | Matching summaries and citations, or an explicit no-answer message. |

Example question request:

```json
{
  "destination_id": 1,
  "question": "What entry requirements should I check?"
}
```

The question feature is deliberately retrieval-only: it joins matching approved summaries and returns their source links. It does not call an AI provider or infer travel rules. If no approved fact with an active source matches, it says that RoamReady does not have a verified answer. The prototype does not store questions or personal trip details.

## Database and review workflow

`app.py` creates six tables: `destinations`, `sources`, `facts`, `fact_sources`, `collection_runs`, and `change_reviews`. Facts have candidate, approved, rejected, or stale states. Website routes filter to approved facts, and they require an active linked source before showing one. The public API has no write route: team members should use a reviewed admin tool or a controlled database workflow to enter sources and facts. Do not approve a fact until its official source URL and last-verified date have been checked.

The database can be stored elsewhere by setting `ROAMREADY_DATABASE` before starting the app. The default local database is ignored by Git. Never commit credentials or private information.

## Team presentation notes

- A destination is a place the pilot supports; a fact is one specific travel claim; a source is the evidence for that claim.
- `fact_sources` connects the two, so each response can show where its information came from.
- `status` separates proposed information from approved public guidance; changing source text should create a review proposal instead of silently replacing an approved fact.
- The assistant endpoint is a transparent keyword matcher for the prototype, not an AI assistant. A later model integration should receive only retrieved approved facts and must validate its citations.
- This backend has not yet been connected to the static `Front-End/test.html` page. The browser headers are open for local prototype use; deployment needs an explicit allowed-origin list and an access-controlled review workflow.
