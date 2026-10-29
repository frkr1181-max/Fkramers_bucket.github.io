# Frontend scaffold

This is a dependency-free browser prototype that follows the supplied RoamReady mid-fidelity screens. It currently supports a demo home page, country-level trip form, dashboard, category switching, and a session-only checklist. The Japan country content is deliberately a placeholder; the app does not show unreviewed travel claims. The backend destination catalog covers all 24 countries in the four research CSVs received so far.

Run the API in one terminal:

```bash
source .venv/bin/activate
fastapi dev app/main.py
```

Serve this folder in another terminal:

```bash
python3 -m http.server 5500 --directory frontend
```

Open `http://127.0.0.1:5500`. The API already allows these local origins through `FRONTEND_ORIGINS`. API/Auth integration is the next implementation step in [the two-week plan](../docs/PROTOTYPE_PLAN.md); no account credentials or trip details are sent from this scaffold.
