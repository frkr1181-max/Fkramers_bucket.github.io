# RoamReady front end: experimental copy

David's working copy of the website, for trying new front-end ideas. It started as an exact copy of `site/` (the reviewed draft in PR #1) on November 9, 2026.

| Folder | What it is | Who changes it |
|---|---|---|
| `site/` | The stable draft that the demo runs from | Only when an experiment is ready to keep |
| `experimental-copy/` | This folder: anything goes | David |
| `app/`, `supabase/`, `collectors/` | The backend | Frankie and Divya |

The two front ends never touch backend files, so all three can be worked on at the same time on `main` without conflicts. Why the site is built this way: [`site/ADR-001-coded-site.md`](../site/ADR-001-coded-site.md).

## Run it

```bash
# terminal 1, from the repo root: the API (same as for site/)
fastapi dev app/main.py

# terminal 2: this copy
python3 -m http.server 5500 --directory experimental-copy
```

Open `http://127.0.0.1:5500`. The tab title says "(experimental)" so it's never mistaken for `site/`.

For quick testing, this copy starts with a saved test trip: Australia, Mar 1 – Mar 30, 2027 (30 days), Leisure. My trip and every guide open with it, and Plan a trip is prefilled. To get the real "No trip yet" flow back, set `DEMO_TRIP` to `null` in `js/trip.js`. The site is light mode only for now, even when the computer is set to dark mode.

The API only accepts the origins listed in `FRONTEND_ORIGINS`, which allows port 5500 by default. To run `site/` and this copy side by side, serve this one on 5501 and add `http://127.0.0.1:5501` to `FRONTEND_ORIGINS` in your own `.env`. Don't commit that `.env`.

## The data

This copy reads the **same live API** as `site/`. When Frankie and Divya publish new facts or change the backend, this copy picks them up after a `git pull` and an API restart. Nothing needs copying.

`data/guide-snapshot.json` is this copy's own saved copy, used when the API isn't running. It is identical to `site/`'s for now. To refresh it from the team's published fact files:

```bash
python3 experimental-copy/tools/build_snapshot.py
```

It writes only into `experimental-copy/data/`. Experiments with made-up or reshaped data belong in a separate file in `data/`, never in the backend or in `site/`.

## Motion

The bouncy feel lives in two files, so it's easy to tune or remove:

- `css/motion.css`: every animation and transition. Buttons squish on press and spring back, tiles and topic cards lift on hover (mouse only), checklist boxes pop and the tick draws itself, dialogs spring in and fade out, and fields shake when they need fixing.
- `js/motion.js`: the entrances, which happen on the trip dashboard only: its title, chips and guide tiles spring in and its band arcs draw once per visit. Every other page, and the rest of the dashboard, is simply there when it opens, and nothing waits for a scroll. It also runs the dialog exits.
- The spring curves are tokens in `css/tokens.css` (`--rr-spring-bouncy`, `--rr-spring-playful`), sampled from Apple-style springs. Change a spring there and every animation using it follows.
- With "reduce motion" turned on in the operating system, everything fades instead of moving.

## Rules for experiments

- Keep `js/api.js` as the only file that calls the backend, and `js/guides.js` as the only file that maps design names to data names. If an experiment needs a new API route, ask Frankie or Divya. Don't add it here.
- Every database string goes through `esc()`, and every link must pass `safeUrl()` (`js/main.js`).
- Colors, radii, type sizes and motion curves come from `css/tokens.css`. Only `transform` and `opacity` should move.
- When an experiment is worth keeping, copy the changed files into `site/` in its own pull request, so the team reviews what the demo will show.

Everything else (pages, files, what's not built yet) is the same as in [`site/README.md`](../site/README.md).
