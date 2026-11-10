# ADR-001: Build the coded hi-fi as its own folder that reads the existing API

**Status:** Proposed (for Frankie and Divya to accept in the pull request)
**Date:** November 9, 2026
**Deciders:** David (design), Frankie (backend), Divya (front end)

## Context

The Orbit hi-fi exists only in Figma, and the backend (FastAPI on Supabase) already serves 24 countries and their published facts. The two have never been connected. The demo is November 12–13, and the backend is working, so the website must not put it at risk.

Four mismatches had to be settled:

| | Data (backend) | Design (Figma) |
|---|---|---|
| Topics | 10 categories | 8 guides |
| Trip purposes | 7 (`tourism`, `business`, `study`, `work`, `family`, `long-term`, `transit`) | 4 (Leisure, Work, Study, Emergency) |
| Level | Country facts | Screens drawn for one Tokyo trip |
| Topic cards | One card per fact, written by the research team | 4 hand-written topics per guide |

David confirmed the website is **country-level**: guides show whatever reviewed facts a country has.

## Decision

1. **A new `site/` folder on the `hifi-site` branch.** Nothing in `app/`, `supabase/`, `collectors/`, `frontend/` or `Front-End/` changes. `main` was tagged `pre-hifi-2026-11-09` before the branch was made, and the branch merges only through a reviewed pull request.
2. **Plain HTML, CSS and JavaScript modules, no build step**, the same stack as the existing `frontend/` scaffold, so anyone on the team can open a file and read it.
3. **The API is a fixed contract.** The site only calls the two public routes, `GET /api/destinations` and `GET /api/destinations/{slug}/facts`, and never changes their shape.
4. **One data file, `js/api.js`, with a fallback.** It calls the live API first. If the API doesn't answer within 4 seconds, it uses `data/guide-snapshot.json`, built from the repo's published fact files by `tools/build_snapshot.py`, and filters it with the same rule as `list_published_facts`. The demo can't break if the backend is down.
5. **One adapter file, `js/guides.js`.** It maps the 10 categories into the 8 guides and the 4 design purposes onto the API's 7, so neither the database nor the design has to rename anything.

### The mapping

| Guide (design) | Categories (data) |
|---|---|
| Entry & documents | `entry` |
| Money & payments | `money` |
| Phones & tech | `phones`, `electricity` |
| Health | `health` |
| Getting there | `arrival` |
| Getting around | `getting-around` |
| Safety | `safety`, `emergency` |
| Local culture | `culture` |

| Purpose (design) | Sent to the API |
|---|---|
| Leisure | `tourism` |
| Work | `work` |
| Study | `study` |
| Emergency | nothing, so only general facts are shown |

## Options considered

### A. A new `site/` folder (chosen)
| Dimension | Assessment |
|---|---|
| Complexity | Low: static files, one data layer |
| Risk to the backend | None: no backend file changes |
| Team familiarity | High: same stack as `frontend/` |

**Pros:** safe to merge or throw away; works with no backend running; easy to review.
**Cons:** for now there are three front ends in the repo (`frontend/`, `Front-End/`, `site/`).

### B. Restyle the existing `frontend/` scaffold
**Pros:** one front end.
**Cons:** rewrites a teammate's working files during demo week, and a broken merge takes the scaffold down with it.

### C. A framework (React or Vite)
**Pros:** components, hot reload.
**Cons:** a build step and dependencies nobody on the team has set up, and more code to defend in a review.

## Consequences

- Easier: the backend team keeps changing the API and database freely as long as the two routes keep their shape.
- Easier: a demo laptop needs no Python running; the snapshot covers it.
- Harder: the snapshot goes stale when facts are published. Rebuild it with `python3 site/tools/build_snapshot.py` before a demo.
- Revisit: sign-in and saved trips (needs Supabase Auth in the browser), Learn more pages, and retiring `frontend/` and `Front-End/` once the team agrees.

## Action items

1. [ ] Frankie or Divya reviews and merges the `hifi-site` pull request
2. [ ] Decide whether Work should send `work` or `business`, and what Emergency should show
3. [ ] Wire Supabase sign-in and `/api/trips` after the demo
4. [ ] Decide which front-end folder the team keeps
