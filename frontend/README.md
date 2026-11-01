# Frontend scaffold

This is a dependency-free browser prototype for country research and preparation, based on the RoamReady mid-fidelity screens. It currently supports a demo home page, country-level trip form, dashboard, category switching, and an in-memory general preparation checklist. Guest trip details are cleared when the page is refreshed or closed. The planner stores an exact stay-day count for entered dates and a possible day range for estimated months/years, along with the selected purpose. The facts API can filter by that range and purpose, but the prototype has not connected Supabase sign-in or sent the trip profile to the API. Saving trips to an account and using saved guides offline are not implemented. These need Supabase Auth, an owner-protected trips table, and a local copy of the saved trip's approved guide content. Japan content remains a placeholder; the app does not show unreviewed travel claims. The backend destination catalog covers all countries in the research data. See the [information collection guide](../docs/INFORMATION_COLLECTION_SPEC.md) for the U.S.-passport audience, source standards, and review process.

Run the API in one terminal:

```bash
source .venv/bin/activate
fastapi dev app/main.py
```

Serve this folder in another terminal:

```bash
python3 -m http.server 5500 --directory frontend
```

Open `http://127.0.0.1:5500`. The API already allows these local origins through `FRONTEND_ORIGINS`. No account credentials or trip details are sent from this scaffold. The destination and facts routes are public and RLS-limited; the prototype still needs to call them to display live guide data.
