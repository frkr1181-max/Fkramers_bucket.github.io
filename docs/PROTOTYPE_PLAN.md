# RoamReady two-week prototype plan

**Target demo: Thursday, November 5, 2026.** This plan aims for one complete, source-grounded trip-preparation flow, not the full destination coverage or automation described as long-term goals. The proposal, research bank, and screens describe different scopes, so this document makes the two-week working scope explicit.

## Scope for the demo

Build a country-level trip preparation flow using the 24 countries in the four research CSVs received so far. Do not make city selection or city itineraries part of the destination model. Support the ten topics in the bank: entry and documents, getting there, getting around, money and payments, safety, health, local culture, phones and internet, electricity and tech, and emergency information. Use citations and review dates; mark any topic without reviewed facts as unavailable.

The demo should let a registered user save trip details to their account, choose a country, open its topic guide, follow source links, and keep a session-only preparation checklist. Supabase Auth signs users in; protected API routes return the country catalog, approved facts, and only the current user's saved trips. Store the destination, travel date range, trip purpose, and optional trip name and description in an owner-protected Supabase table. Do not collect passport, health, or precise-location details.

The initial front-end scaffold is intentionally a static preview. It contains no verified travel claims and does not yet call the API or sign in; trip details and checklist completion currently live only in the browser tab. The schedule below brings account sign-in, saved trip records, and API-backed guides together.

## Scope decisions and limits

The current catalog contains 24 destinations across Aahana, David, Dion, and Hilna's CSV files. More country files may be added later. Country guides use stable slugs so England and Scotland remain separate entries despite sharing ISO code GB.

For the two-week demo, add basic owner-only trip create, list, read, update, and delete behavior. Keep checklist completion session-only until its persistence needs are designed separately. Defer trip sharing and profile settings, collectors for additional sources, scheduled change detection, all-destination search, offline storage, and a general-purpose AI chatbot. Review a small set of candidates manually. If there is time for an assistant, constrain it to retrieved approved facts and show the supporting sources; otherwise demo the assistant panel as a clearly marked future step.

## Repository structure

```text
app/                       FastAPI backend
  api/routes/              Health, Auth, country, fact, and planned trip endpoints
  core/config.py           Environment and local .env settings
  repositories/            Server-only guide queries and user-scoped trip queries
  schemas/                 Country, fact, and trip request/response models
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
  TRIP_DATA_STORAGE_PLAN.md  User trip fields, ownership workflow, and acceptance checks
data/candidates/           Local, unreviewed source output (git-ignored)
supabase/migrations/       Versioned country, candidate, and published-fact schema
```

Keep the `app/` location so the existing FastAPI command still works. Keep collection separate from request handlers and database queries separate from route functions. Do not put downloaded source pages, unreviewed claims, or credentials in the public frontend folder.

## Backend framework

For this prototype, use Supabase Auth for identity and FastAPI for the API. Keep the browser on the publishable key; never put a secret or service-role key in frontend code. Send the Supabase access token as `Authorization: Bearer <token>` to protected FastAPI routes. The API validates tokens through Supabase Auth and returns `401` for invalid sessions. The local frontend origins are allowed by CORS. The server-only key reads published travel facts after Auth validation. For user-owned trip writes, use the authenticated user's token with the publishable key so Supabase RLS can enforce ownership; do not use the service-role key for trip CRUD because it bypasses RLS.

Recommended API routes:

| Route | Purpose | Access |
| --- | --- | --- |
| `GET /api/health` | Service check | Public |
| `GET /api/auth/me` | Current signed-in identity | Registered user |
| `GET /api/destinations` | Destination picker | Registered user |
| `GET /api/destinations/{destination_slug}/facts?category=entry` | Reviewed facts and citations for a country | Registered user |
| `POST /api/trips` | Save the signed-in user's trip details | Registered user |
| `GET /api/trips` and `GET /api/trips/{trip_id}` | List or read only the signed-in user's trips | Registered user |
| `PATCH /api/trips/{trip_id}` and `DELETE /api/trips/{trip_id}` | Edit or delete only the signed-in user's trip | Registered user |

The protected facts route reads `travel_facts` from Supabase and returns only rows where `published = true`. It supports an optional category filter. Raw scraper output goes to `source_candidates`; reviewers must rewrite and verify claims before adding published facts.

The applied schema is in `supabase/migrations/`: `destinations` is the country catalog, `source_candidates` stores unreviewed material, `travel_facts` stores reviewed claims with citations and a `published` flag, and `user_trips` stores account-owned trip details. RLS allows anonymous reads only for active destinations and published facts; `source_candidates` remains private. FastAPI's guide routes still require a signed-in user and read published rows with its server-only key after validating Auth. The trip table has owner-only RLS policies and authenticated-role grants, applied in [migration 20261029225934_user_trips.sql](../supabase/migrations/20261029225934_user_trips.sql). The FastAPI trip routes and user-token forwarding still need implementation before trip data is saved through the app.

## Data workflow

The CSVs are a research bank, not an import-ready database. Their cells mix source names, URLs, notes, and candidate claims. The daily GOV.UK monitor creates a new versioned candidate when one of its five approved source pages changes; the importer copies it into the private `source_candidates` table. A teammate should confirm the claim, capture a title and URL, and record who checked it and when. Rewrite and save approved travel guidance in `travel_facts` with citations. Only rows marked `published` are returned by FastAPI. Never treat a source mention or a saved research-bank cell as proof that its statement is still current.

Trip data follows a separate account-owned path: the signed-in user submits the prototype's destination, date range, purpose, and optional name and description; FastAPI validates the Auth token and form values, derives `owner_id` from the verified account, and sends CRUD calls to Supabase using that user's token. Row Level Security grants that account access only to rows whose `owner_id` matches `auth.uid()`. Generated guide categories are not saved as form input. The detailed field map, validation rules, repository changes, and security checks are in [the trip data storage plan](TRIP_DATA_STORAGE_PLAN.md).

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
| 6 | Fri, Oct 30 | Connect Supabase Auth in the frontend and implement the user-scoped trip repository using the access token; the owner-only migration is applied. | Hilna + David; Divya checks data plan | Signed-out users cannot save; two test accounts cannot access each other's trips. |
| 7 | Mon, Nov 2 | Add FastAPI trip create/list/read/update/delete routes and persist the screenshot's form fields. Connect API data to guide pages. | Hilna + David; Divya reviews data shape | A saved trip reloads for its owner, while checklist completion remains session-only. |
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
- A registered user can save, reload, edit, and delete a trip containing the screenshot's destination, dates, purpose, and optional name/description.
- Two test accounts confirm that each user can only read and change their own trips; invalid dates, purposes, or destinations are rejected.
- A user can open each of the three guide sections and complete session-only checklist items.
- Every displayed travel fact has an official source link and a checked date.
- Empty data, sign-out, expired token, and API failure do not display stale placeholder guidance as current facts.
- The prototype works with keyboard navigation and at a phone-sized viewport.
- The team can explain what is real, what is a prototype placeholder, and what is deferred.
