# RoamReady two-week prototype plan

**Target demo: Thursday, November 5, 2026.** This plan aims for one complete, source-grounded trip-preparation flow, not the full destination coverage or automation described as long-term goals. The proposal, research bank, and screens describe different scopes, so this document makes the two-week working scope explicit.

## Scope for the demo

Build a country-level trip preparation flow using the 24 countries in the four research CSVs received so far. Do not make city selection or city itineraries part of the destination model. Support the ten topics in the bank: entry and documents, getting there, getting around, money and payments, safety, health, local culture, phones and internet, electricity and tech, and emergency information. Use citations and review dates; mark any topic without reviewed facts as unavailable.

The demo should let a registered user choose a country, open its topic guide, follow source links, and keep a session-only preparation checklist. Supabase Auth signs users in; protected API routes return the country catalog and approved facts. Keep trip dates and preferences in the browser for the demo, and do not collect passport, health, or precise-location details.

The initial front-end scaffold is intentionally a static, session-only preview. It contains no verified travel claims and does not yet call the API or sign in. The schedule below brings those pieces together.

## Scope decisions and limits

The current catalog contains 24 destinations across Aahana, David, Dion, and Hilna's CSV files. More country files may be added later. Country guides use stable slugs so England and Scotland remain separate entries despite sharing ISO code GB.

For the two-week demo, defer collectors for additional sources, scheduled change detection, all-destination search, trip sharing and profile settings, offline storage, and a general-purpose AI chatbot. Review a small set of candidates manually. If there is time for an assistant, constrain it to retrieved approved facts and show the supporting sources; otherwise demo the assistant panel as a clearly marked future step.

## Repository structure

```text
app/                       FastAPI backend
  api/routes/              Health, Auth, country, and fact endpoints
  core/config.py           Environment and local .env settings
  repositories/            Server-only Supabase REST queries
  schemas/                 Country and fact response models
  auth.py                  Supabase access-token validation
  main.py                  App construction, middleware, and route registration
collectors/                Source-specific web collectors and candidate importer
frontend/                  Browser prototype (new, no build dependencies)
  index.html
  src/
    main.js                Home, trip form, dashboard interactions
    data.js                Demo-only labels and checklist items
    styles.css             Responsive styles
    services/api.js        Small fetch helper for protected FastAPI routes
docs/
  PROTOTYPE_PLAN.md        Scope, team work, schedule, and handoff
data/candidates/           Local, unreviewed source output (git-ignored)
supabase/migrations/       Versioned country, candidate, and published-fact schema
```

Keep the `app/` location so the existing FastAPI command still works. Keep collection separate from request handlers and database queries separate from route functions. Do not put downloaded source pages, unreviewed claims, or credentials in the public frontend folder.

## Backend framework

For this prototype, use Supabase Auth for identity and FastAPI for the API. Keep the browser on the publishable key; never put a secret or service-role key in frontend code. Send the Supabase access token as `Authorization: Bearer <token>` to protected FastAPI routes. The API validates tokens through Supabase Auth and returns `401` for invalid sessions. The local frontend origins are allowed by CORS. Its server-only key reads published rows from Supabase after Auth validation.

Recommended read API:

| Route | Purpose | Access |
| --- | --- | --- |
| `GET /api/health` | Service check | Public |
| `GET /api/auth/me` | Current signed-in identity | Registered user |
| `GET /api/destinations` | Destination picker | Registered user |
| `GET /api/destinations/{destination_slug}/facts?category=entry` | Reviewed facts and citations for a country | Registered user |

The protected facts route reads `travel_facts` from Supabase and returns only rows where `published = true`. It supports an optional category filter. Raw scraper output goes to `source_candidates`; reviewers must rewrite and verify claims before adding published facts.

The schema is in `supabase/migrations/`: `destinations` is the country catalog, `source_candidates` stores unreviewed material, and `travel_facts` stores reviewed claims with citations and a `published` flag. These tables have RLS enabled and no client policies or grants to `anon` and `authenticated`; FastAPI reads with its server-only key only after validating Auth. Keep trips out of the database during this two-week demo unless the team has time to design and verify owner-only RLS.

## Data workflow

The CSVs are a research bank, not an import-ready database. Their cells mix source names, URLs, notes, and candidate claims. The daily GOV.UK monitor creates a new versioned candidate when one of its five approved source pages changes; the importer copies it into the private `source_candidates` table. A teammate should confirm the claim, capture a title and URL, and record who checked it and when. Rewrite and save approved travel guidance in `travel_facts` with citations. Only rows marked `published` are returned by FastAPI. Never treat a source mention or a saved research-bank cell as proof that its statement is still current.

Suggested API fact shape:

```json
{
  "id": "stable-fact-id",
  "destination_slug": "japan",
  "category": "entry",
  "title": "Short heading",
  "plain_summary": "Traveler-friendly wording checked against the source.",
  "last_verified_at": "YYYY-MM-DD",
  "sources": [
    {"title": "Official source page", "organization": "Publisher", "url": "https://example.gov/page", "checked_at": "YYYY-MM-DD"}
  ]
}
```

Do not copy the example URL or placeholder date into a real record.

## Ten workday schedule

| Day | Date | Main work | Owners | Exit check |
| --- | --- | --- | --- | --- |
| 1 | Fri, Oct 23 | Agree to the one-destination demo, three categories, repo workflow, and named owners. Set up local frontend and API run instructions. | All; Divya coordinates | Everyone can run both local servers; decisions recorded here. |
| 2 | Mon, Oct 26 | Review country entries in the four CSVs. Select one country and verify sample entry, transport, safety, and emergency sources. Finalize the fact/API contract. | David + Dion + Frankie (research); Hilna + Divya (data shape) | A short list of claims has official links, reviewers, and dates. |
| 3 | Tue, Oct 27 | Build the home and trip-planning screens against the supplied prototype. | Aahana (UX), David + Divya (frontend) | Destination and trip form work on desktop and mobile widths. |
| 4 | Wed, Oct 28 | Build the trip overview, category detail, source list, and checklist interactions. | David + Aahana; Frankie reviews language | User can create a trip and move from overview to a guide and back. |
| 5 | Thu, Oct 29 | Implement the country catalog/fact API response and category filtering. Keep it read-only. | Hilna (API), Divya (schema/data), David (integration) | API returns the selected country's reviewed sample record and source links. |
| 6 | Fri, Oct 30 | Connect Supabase Auth in the frontend and send access tokens to protected routes. Check local CORS and error states. | Hilna + David; Divya checks setup guide | Signed-out, signed-in, expired-token, and unavailable-service states are understandable. |
| 7 | Mon, Nov 2 | Connect API data to guide pages. Add empty, loading, and retry states. Add the checklist completion behavior. | David + Hilna; Aahana reviews | UI shows API-backed sources and does not substitute mock claims when data is absent. |
| 8 | Tue, Nov 3 | Run at least two short usability sessions with the prepared task: find entry steps, transport, and emergency help. Fix the largest confusion points. | Dion + Frankie (sessions), Aahana (changes), all observe | Record observed issues and fixes; no unsupported travel statement is visible. |
| 9 | Wed, Nov 4 | Stabilize, check keyboard use and narrow-screen layout, verify every citation, and write a 3-minute demo script. | All; Divya tracks remaining work | No new features; each demo step has an owner and fallback. |
| 10 | Thu, Nov 5 | Rehearse on a clean browser, present the working flow, and record limitations and next decisions. | All | New teammate can run it from README and complete the demo path. |

## Team ownership

- **Aahana:** prototype flow, interaction design, usability findings, and copy review.
- **David:** frontend implementation and end-to-end API integration.
- **Hilna:** FastAPI, Supabase Auth/API integration, and database design.
- **Divya:** day-to-day coordination, data shape, project decisions, and setup/handoff documentation.
- **Dion:** source research, user sessions, and feedback synthesis.
- **Frankie:** source research, fact verification, and user testing support.

Pair on shared work so no part of the demo depends on a single person's laptop. Use short-lived `feature/<topic>` branches and merge small pull requests into the default branch daily, with one teammate reviewing changes. Avoid parallel edits to the same screen or route.

## Demo acceptance checklist

- A teammate can start FastAPI and the frontend using the documented commands.
- A registered user can sign in, choose from the 24-country catalog, and load a protected country guide.
- A user can create a sample trip, open each of the three sections, and complete checklist items.
- Every displayed travel fact has an official source link and a checked date.
- Empty data, sign-out, expired token, and API failure do not display stale placeholder guidance as current facts.
- The prototype works with keyboard navigation and at a phone-sized viewport.
- The team can explain what is real, what is a prototype placeholder, and what is deferred.
