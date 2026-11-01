# RoamReady two-week prototype plan

**Target demo: Friday, November 13, 2026.** This plan aims for one complete, source-grounded trip-preparation flow, not the full destination coverage or automation described as long-term goals. The proposal, research bank, and screens describe different scopes, so this document makes the two-week working scope explicit.

## Scope for the demo

Build a country-level trip preparation flow for travelers using a U.S. passport, using the 24 countries in the four research CSVs received so far. Do not make city selection or city itineraries part of the destination model. Support trip purposes (tourism, study, work, visiting family or friends, long-term stay or relocation, and transit), with either exact dates or an estimated stay length. Support the ten topics in the bank: entry and documents, getting there, getting around, money and payments, safety, health, local culture, phones and internet, electricity and tech, and emergency information. Use citations and review dates; mark any topic without reviewed facts as unavailable.

RoamReady covers country research and preparation. It does not compare or book flights or accommodations, create day-by-day itineraries, or provide live trip-planning prices. Anyone can use the guest flow to choose a country, enter trip purpose and flexible timing, open its topic guide, and use the general preparation checklist shown in the mid-fidelity design. Guest trip details live only in page memory and are cleared on refresh or page close. Offer account creation or sign-in as an optional way to save a trip to the user's profile. Account-backed saving requires Supabase Auth and a trips table with owner-only row-level security. A saved trip should remain available offline after it has been saved/synced on the device; source links can open when a connection is available, while saved guidance shows its checked date. Public guide reads use the publishable key and RLS policies; account trip routes remain authenticated. Do not collect passport, health, or precise-location details. Make trip filters visible only when relevant reviewed data is actually filtered by those conditions.

The account-owned trip schema is defined in `supabase/migrations/20261029225934_user_trips.sql`; it supports the current planner's optional exact dates or estimated stay length and seven purposes (`tourism`, `business`, `study`, `work`, `family`, `long-term`, `transit`). GitHub's latest build notes say this migration has been applied; check the target project's migration history before attempting to apply it again. The FastAPI trip routes and frontend saving still need implementation. Keep booking and accommodation data out of the trip record. Public guide reads use the publishable key and RLS; account trip routes remain signed-in and owner-only.

Before applying the `202610290001` public-read migration or the later `20261029222847` and `20261029225934` migrations, compare the files with the target Supabase migration history. Do not replay migrations that are already recorded remotely; reconcile any gap before applying later timestamps.

The initial front-end scaffold is intentionally a static preview. Guest trip details exist only in memory and are cleared on refresh. It contains no verified travel claims and does not yet call the API or sign in. The schedule below brings those pieces together.

## Scope decisions and limits

The current catalog contains 24 destinations across Aahana, David, Dion, and Hilna's CSV files. More country files may be added later. Country guides use stable slugs so England and Scotland remain separate entries despite sharing ISO code GB.

For the two-week demo, prioritize guest guide access, reviewed facts, optional account trip saving, and a local copy of a saved guide for offline viewing. Keep checklist items general across trip types and countries; save their completion with the account trip only if that behavior is implemented and verified. Defer trip sharing, profile settings, collectors for additional sources, scheduled change detection, all-destination search beyond the supplied country roster, and a general-purpose AI chatbot. Review a small set of candidates manually.

## Repository structure

```text
app/                       FastAPI backend
  api/routes/              Health, Auth, public country/fact, and planned trip endpoints
  core/config.py           Environment and local .env settings
  repositories/            Public RLS-limited guide queries and planned user-scoped trip queries
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
    services/api.js        Small fetch helper for FastAPI routes
docs/
  PROTOTYPE_PLAN.md        Scope, team work, schedule, and handoff
  TRIP_DATA_STORAGE_PLAN.md  User trip fields, ownership workflow, and acceptance checks
data/candidates/           Local, unreviewed source output (git-ignored)
supabase/migrations/       Versioned country, candidate, and published-fact schema
```

Keep the `app/` location so the existing FastAPI command still works. Keep collection separate from request handlers and database queries separate from route functions. Do not put downloaded source pages, unreviewed claims, or credentials in the public frontend folder.

## Backend framework

For this prototype, use Supabase Auth for identity and the existing root FastAPI app as the single backend. Public guide reads use the publishable key and RLS; account trip routes use a validated access token. Never put a secret or service-role key in frontend code. Use the authenticated user's token with the publishable key for trip CRUD so Supabase RLS enforces ownership; do not use the service-role key for trip CRUD because it bypasses RLS. The separate `Backend/` Flask folder from GitHub is an experimental read-only example, not a second production backend.

Recommended API routes:

| Route | Purpose | Access |
| --- | --- | --- |
| `GET /api/health` | Service check | Public |
| `GET /api/auth/me` | Current signed-in identity | Registered user |
| `GET /api/destinations` | Destination picker | Public; active rows only |
| `GET /api/destinations/{destination_slug}/facts?category=entry` | Reviewed facts and citations for a country | Public; published rows only |
| `POST /api/trips` | Save the signed-in user's trip details | Registered user |
| `GET /api/trips` and `GET /api/trips/{trip_id}` | List or read only the signed-in user's trips | Registered user |
| `PATCH /api/trips/{trip_id}` and `DELETE /api/trips/{trip_id}` | Edit or delete only the signed-in user's trip | Registered user |

The public facts route uses the publishable key and Supabase RLS to return only `published = true` rows; it supports optional category, stay-range, and purpose filters. Raw scraper output goes to `source_candidates`; reviewers must rewrite and verify claims before adding published facts.

The schemas are in `supabase/migrations/`: `destinations` is the country catalog, `source_candidates` stores unreviewed material, `travel_facts` stores reviewed claims with citations, and `user_trips` stores account-owned trip details. Anonymous RLS permits reads only for active destinations and published facts; `source_candidates` remains private. The FastAPI guide routes use the publishable key for these public reads. The user-trip table has owner-only RLS policies in [migration 20261029225934_user_trips.sql](../supabase/migrations/20261029225934_user_trips.sql), but the FastAPI trip routes and frontend account saving still need implementation.

## Data workflow

The CSVs are a research bank, not an import-ready database. Their cells mix source names, URLs, notes, and candidate claims. The daily GOV.UK monitor creates a new versioned candidate when one of its five approved source pages changes; the importer copies it into the private `source_candidates` table. A teammate should confirm the claim, capture a title and URL, and record who checked it and when. Rewrite and save approved travel guidance in `travel_facts` with citations. Only rows marked `published` are returned by FastAPI. Never treat a source mention or a saved research-bank cell as proof that its statement is still current.

Trip data follows a separate account-owned path: the signed-in user submits the destination, optional dates or estimated duration, and purpose; FastAPI validates the Auth token and form values, derives `owner_id` from the verified account, and sends CRUD calls to Supabase using that user's token. Row Level Security grants that account access only to rows whose `owner_id` matches `auth.uid()`. Guest data is never saved. The device caches approved guide content for offline use only after an account trip has synced online. See [the trip data storage plan](TRIP_DATA_STORAGE_PLAN.md).

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
| 1 | Mon, Nov 2 | Align run instructions and API contract; start both local servers. Decide which country guide will be complete for the demo. | All; Divya coordinates | Everyoshow mene can run both servers; demo country and owners are recorded. |
| 2 | Tue, Nov 3 | Verify demo-country entry, transport, safety, and emergency facts against official sources. | David + Dion + Frankie (research); Hilna + Divya (data shape) | Every demo claim has a source, reviewer, and checked date. |
| 3 | Wed, Nov 4 | Connect the country picker and country facts endpoint to the guest flow. | David + Divya (frontend); Hilna (API) | Country selection and published fact loading work from the browser. |
| 4 | Thu, Nov 5 | Finish the overview, country-wide topic guide, citations, and general checklist. | David + Aahana; Frankie reviews language | Guest can move through preparation topics and checklist. |
| 5 | Fri, Nov 6 | Complete one source-grounded country guide and verify conditional facts for trip length and purpose. | Research owners + Hilna + Divya | Unsupported or unreviewed facts are not presented as current advice. |
| 6 | Mon, Nov 9 | Connect optional Supabase Auth and implement the user-scoped trip repository against the existing owner-only table. | Hilna + David; Divya checks data plan | Guests retain access; signed-in users can save only their own trips. |
| 7 | Tue, Nov 10 | Add trip CRUD and connect account saves; persist general checklist progress if implemented. | Hilna + David; Divya reviews data shape | Saved trips reload for their owner; no guest data is written. |
| 8 | Wed, Nov 11 | Add local offline copies for signed-in trips and run short usability sessions. | Dion + Frankie (sessions), David + Aahana (changes) | Synced guide opens offline; largest usability issues are recorded and fixed. |
| 9 | Thu, Nov 12 | Verify citations, keyboard use, narrow layout, account isolation, and the demo script. | All; Divya tracks remaining work | No unsupported travel statements; each demo step has a fallback. |
| 10 | Fri, Nov 13 | Rehearse from a clean browser, present the prototype, and record limitations and next decisions. | All | A teammate can follow the README and complete the demo path. |

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
- A guest can choose a country from the active catalog and load its published guide without signing in.
- If account saving is included in the demo, a registered user can save, reload, edit, and delete a trip; two accounts cannot access each other's trips.
- Two test accounts confirm that each user can only read and change their own trips; invalid dates, purposes, or destinations are rejected.
- A user can open the guide sections and complete general checklist items; checklist persistence must match the implementation and user state.
- Every displayed travel fact has an official source link and a checked date.
- Empty data, sign-out, expired token, and API failure do not display stale placeholder guidance as current facts.
- The prototype works with keyboard navigation and at a phone-sized viewport.
- The team can explain what is real, what is a prototype placeholder, and what is deferred.
