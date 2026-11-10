# RoamReady main frontend

This is the November 9 design and the active guest application. Start FastAPI from the repository root with `fastapi dev app/main.py`, then open http://127.0.0.1:8000/ . Configure the backend using the root `.env.example`.

Home → Plan a trip → My trip keeps the original design. Japan topic cards, emergency information, and JSON guide downloads use published FastAPI facts with purpose and stay-length filters. Each fact includes sources and its verification date. Failed requests show a retry action and never substitute draft Japan research. Other countries remain explicitly labeled draft previews.

For a static preview: `python3 -m http.server 5500 --directory Front-End/user-test`. FastAPI must also be running on port 8000. For a separately hosted backend, pass `?api=https://YOUR-API-HOST` and configure its allowed frontend origin. Opening the HTML directly is no longer the supported preview workflow.

Guest trip details and checklist completion clear on refresh. Account saving, a live assistant, and offline app support are not connected. Downloads are JSON snapshots, including the selected trip, published Japan facts (or other-country draft research), and checklist. Static `countries.js` is retained for country names and other-country drafts; Japan guide text is loaded from the API.

The previous prototype is preserved in `.archive/legacy-frontend/`. The root README contains the current application instructions.
