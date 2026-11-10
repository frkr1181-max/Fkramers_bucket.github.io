# RoamReady website (coded Orbit hi-fi)

The Figma hi-fi (RoamReady-Prototype, High-fidelity Layout page) built as a working website that reads the team's country data. It's plain HTML, CSS and JavaScript with no build step, like `frontend/`.

Nothing outside this folder was changed. Why it's built this way: [ADR-001](ADR-001-coded-site.md).

## Run it

```bash
# terminal 1: the API (from the repo root, see the main README for setup)
source .venv/bin/activate
fastapi dev app/main.py

# terminal 2: the website
python3 -m http.server 5500 --directory site
```

Open `http://127.0.0.1:5500`. Port 5500 matters, because it's one of the origins the API allows in `FRONTEND_ORIGINS`.

**No backend running?** The site still works. After 4 seconds without an answer it switches to `data/guide-snapshot.json`, and the footer says "Guide data is a saved copy from …" instead of "… comes live from the RoamReady database." To point at a different API, add `?api=https://your-host` to the address.

## What's in the demo

| Page | Address | Data |
|---|---|---|
| Home | `#/` | none (static hero, steps and source types) |
| Plan a trip | `#/plan` | the 24 countries from `GET /api/destinations` |
| My trip | `#/trip?country=japan&from=2027-03-15&to=2027-03-28&purpose=leisure` | facts for the trip: emergency numbers, and whether each guide has reviewed info |
| Guide | `#/guide/entry?…` (also `money`, `phones`, `health`, `there`, `around`, `safety`, `culture`) | one card per published fact; Learn more shows the full fact and its own sources |
| About | `#/about` | none |

The trip is kept in the address bar, so a refresh keeps it and a link can be shared. It is never saved to an account or to browser storage. The trip description stays in the page's memory only.

Log in shows a note that accounts aren't switched on yet. Sign up and Continue as guest both open Plan a trip, as in the prototype.

## Files

| File | What it does |
|---|---|
| `index.html` | Header, footer and dialogs shared by every page |
| `css/tokens.css` | Colors, radii, shadows and type sizes copied from the Figma variables (`--rr-…`) |
| `css/site.css` | Layout and components, in the order of the pages |
| `js/main.js` | The router and the five pages. Every bit of database text goes through `esc()` |
| `js/api.js` | **The only file that talks to the backend**, plus the snapshot fallback |
| `js/guides.js` | **The adapter**: 10 categories into 8 guides, 4 purposes onto the API's 7, and emergency-number parsing |
| `js/trip.js` | The guest trip: reading it from the address, trip length, date format |
| `data/guide-snapshot.json` | Saved copy of the 24 countries and 252 published facts |
| `tools/build_snapshot.py` | Rebuilds the snapshot from `docs/research/*/facts.json` and the catalog migration |
| `assets/figma/` | Icons, logo lockups and decor exported from the Figma file |
| `assets/photos/` | The three band photos, resized to 1920px WebP (they're placeholders in Figma too) |

## Before a demo

```bash
python3 site/tools/build_snapshot.py
```

This rebuilds the saved copy from the repo's published fact files. It holds 252 facts; the database reports 263, so the live API may show a few more.

## Not built yet

- Sign-in, sign-up and saved trips. These need Supabase Auth in the browser and the existing `/api/trips` routes.
- The 32 hand-written Learn more pages. Learn more here opens the full fact instead.
- Profile, and the phone versions of About and Profile.
- Quick tips on guide pages. The data has no tips field.

## Choices for the team to confirm

- **Work** sends `purpose=work`. The data also has `business`; switch the `api` value in `js/guides.js` if that fits better.
- **Emergency** has no matching purpose in the data, so it sends none and only general facts show.
- The 8 checklist tasks are the hi-fi's, with the country name swapped in. Two Japan-only tasks became general ones: "Register on Visit Japan Web" is now "Check the entry rules for {country}", and "Save your emergency card" is now "Save your emergency numbers".
- Guides that combine two categories (Phones & tech, Safety) show them in one list.
