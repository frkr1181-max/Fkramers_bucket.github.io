# Integration verification — November 10, 2026

## Implemented

David's stable `site/` is the canonical frontend. Earlier prototypes are archived and are not served by FastAPI. The existing high-fidelity layout and assets are preserved. The app provides guest planning, reviewed guides, email/password login, sign-up with email-confirmation feedback, saved-trip list, create/update/delete, and saved checklist restoration. Sources and last-verified dates are shown. Optional descriptions remain in memory and are explicitly not saved.

## Checks completed

- Python: 27 tests pass, covering authentication, request validation, identity rejection, owner filters, public guide filtering, and the canonical static entry point.
- Frontend integration checks: inclusive durations, leap years, invalid dates, purpose mapping, conditional snapshot eligibility, review-state exclusion, API payload fields, checklist restoration, and saved-trip query round-trip.
- Live Supabase: project `zmvkvirrtnyghqlsoqmo` is ACTIVE_HEALTHY. There are 263 published facts across 24 destinations. RLS is enabled on destinations, travel_facts, source_candidates, and user_trips. Owner SELECT/INSERT/UPDATE/DELETE policies are present on user_trips.
- A rolled-back SQL transaction verified owner create/update/read, blocked second-owner reads/updates/deletes and rejected forged ownership inserts. No data from that transaction was retained.
- Two temporary login-capable verification accounts were used for real Auth login and API checks. Account A saved a Japan trip and a completed checklist item. A browser refresh restored the trip and the checked item from the live API. Editing and saving preserved the original trip ID, and guide navigation retained it. Cleanup verified zero remaining verification users and trips.
- Account B received 404 for GET, PUT and DELETE against A's trip through FastAPI, saw none of A's trips in its list, and received zero rows from a direct Supabase REST read of that trip.
- Anonymous Supabase requests could not read user_trips or source_candidates. Public Japan tourism and work queries returned eligible reviewed facts, including correct purpose filtering.
- The new guide page was checked in the browser with live citations, verification dates and a matching 14-day leisure condition. Desktop screenshot retained with the task output.

## Migration and advisory findings

The live migration history records the source-review, catalog, applicability, initial trip, and November 5 alignment migrations. The repo's `202610290001_roamready_public_reads_and_destination_roster.sql` is not recorded in that history, although the expected public-read policies exist. Do not reapply it blindly; reconcile the migration ledger separately after reviewing its full contents and existing roster. No schema or policy changes were needed for this integration.

The security advisor reported one informational item: source_candidates has RLS enabled and no policies. That is intentional: the private source-review queue is not readable by anonymous or authenticated clients. [Advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Still to verify after deployment

Render files and instructions are prepared; nothing has been pushed or deployed. Complete the Blueprint setup and Supabase Site URL/allowed redirect configuration in `DEPLOYMENT.md`. A real sign-up confirmation email and its callback have not been exercised; test them using a team member's email. Password login was verified using confirmed temporary accounts without sending mail. Deployed mobile testing remains pending; no successful mobile viewport verification is claimed from the local browser tooling.

The checked-in snapshot has 252 published records, compared with 263 live records. It is labeled as a saved copy and must not be used as evidence of complete current coverage. Account operations always require the live API. Checklist completion requires an explicit Save trip; offline account synchronization is not implemented.

## Full Japan connection — November 10

Japan now has all 32 subcards (four per guide), with 16 distinct published-fact titles mapped to the appropriate topics. Only the API's trip-eligible facts are displayed as published; static research mappings cannot bring back excluded work/long-stay facts. Eleven follow-up draft records, their shared notes and citations are connected, and all ten original research sections are available under the appropriate guides as clearly labeled drafts. The data pack is reproducible using `site/tools/build_japan_subcards.py`. Added frontend checks cover structure, draft status, cross-category mapping, eligibility preservation and coverage. Database/publication state was not modified.

The supplemental Narita international-arrivals note is also connected under Narita Airport and Arrival steps; its search-result-only evidence limit is shown. No records were deleted or published for the full Japan connection.

## Japan publication and October 29 cross-check

Published 28 reviewed additions on November 10 (44 Japan facts total); original records were preserved. The live five-day tourism API returns 42 facts, including all 28 additions, with published support in every one of the 32 subcards. Work and long-stay facts remain excluded. See [publication report](research/publication-2026-11-10-japan/README.md). The two requested coverage/archive messages were removed. Superseded draft notes are omitted from topic dialogs when the corresponding published facts are available.

## Permanent topic navigation

The approved full-page preview was implemented in the canonical `site/` without copying preview-only Auth stubs or forcing snapshot mode. All guide Learn more controls are ordinary links to topic routes. Japan supports all 32 subcards; other destinations use stable fact IDs within their guide category. Full detail content, citations, verification dates and optional official excerpts are preserved. Saved-trip topic routes authenticate and fetch the owned trip before displaying account data. Added frontend checks cover route-topic resolution, all 32 Japan topics, other-country categories, missing topics and eligibility.

## Japan card relevance cleanup

Replaced broad keyword-derived placement with an explicit topic-to-fact map. Visa excludes passport text. Passport displays the exact passport-only passage of its original fact, retaining the same citation, ID and verification date. Broad duplicated money, connection, transport and etiquette facts are no longer repeated across unrelated cards. All 32 topics retain eligible published information; each guide’s cards have non-overlapping fact assignments. The original 44 database facts and research files were not modified or deleted. Added checks enforce within-guide uniqueness, Passport-only text and preservation of the full original fact.

Passport/Visa expansion (2026-11-10): 15 additional officially sourced facts published, 59 Japan facts total. Seven Passport sections; eight additional Visa facts, with conditional work/study guidance filtered by trip purpose. Live five-day tourism response: 56 eligible facts. Existing data preserved. Backend tests: 27 passed; frontend topic and eligibility checks passed.

## Original country research integration — November 10

Removed the historical Japan research accordion and its public payload; retained all original research files. Linked 240 original sections across 24 researched destinations to saved published fact IDs. Restored 11 already-published South Korea records to the static fallback. All 316 snapshot facts exactly match the live export for text, dates, source fields and eligibility. Explicitly included Japan voltage/frequency detail in Electricity. No database writes or deletions. Four frontend check suites and all 27 backend tests passed. See [integration report](research/integration-2026-11-10/README.md).

November 10 missing-country publication: 259 additional source-reviewed facts across Brazil, Cabo Verde, Canada, Colombia, Croatia, Czechia, Spain, Sweden, Switzerland, Türkiye, Uruguay and Uzbekistan. All 36 dropdown destinations now have facts in all ten categories (575 total). New facts use explicit focused-topic mappings and existing trip filters. Original 316 records preserved. See docs/research/publication-2026-11-10-missing-countries/README.md for sources, limits and checks.

Original-country follow-up publication: 282 additional facts, 857 total, Australia 28. All 380 original follow-up records have a documented disposition. Empty public topic cards are omitted; existing 575 records and all original research are preserved. See docs/research/publication-2026-11-10-original-countries/README.md.
