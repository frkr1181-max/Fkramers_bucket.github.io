# Country fact publication — November 5, 2026

Publication was explicitly requested for both existing database facts and country research/source candidates. This batch changes backend data only. It does not change the frontend.

## Applied results

- Added 195 reviewed fact records across the 23 draft countries that previously had no published facts.
- Revised and published the existing South Korea money fact. It explicitly describes the disagreement between Korea Customs and the U.S. State Department; it does not claim that the disagreement is resolved or that cash is exempt.
- Preserved the 11 previously published South Korea facts. The database now has 207 published facts across 24 destinations.
- Japan now has 16 published facts. Thirteen manually prepared candidates were approved as adapted source material, with links to narrower reviewed public facts. Six raw FCDO candidates were rejected for direct publication because their British-passport/UK-consular framing and overlapping scraped text are unsuitable as U.S.-audience public facts. Raw candidate text remains private and is not returned by the guide API.
- No traveler account, trip, credential, or frontend data was modified by this publication.

## Scope and limitations

Every research country received reviewed public records, but the original draft prose was not published wholesale. A source link or a successful download is not verification of every statement on that page. The payload contains only the claims explicitly reviewed and rewritten for this batch. The original research drafts remain research artifacts.

There are 56 country/topic coverage gaps across the ten-topic guide standard; these are listed in `coverage-gaps.json`. The published records are an initial reviewed set, not complete country guides. Full app recommendations, SIM eligibility/coverage details, current USD exchange-rate values, date-specific forecasts, all medicine cases, and some arrival/culture topics remain incomplete. No live rates or forecasts were fabricated. Source failures, robots exclusions, blank app shells, and overly broad homepages were not treated as proof of the draft claims.

Known conflicts are visible: Qatar passport validity is unresolved; South Korea cash guidance disagrees; Saudi electrical guidance includes a legacy-supply qualification. Mexico warnings preserve state-level variation. Airport/city/regional transport facts are labelled as local examples. Entry conditions are stored separately from general passport and authorization checks.

## Evidence and verification

- `facts.json`: exact reviewed payload, including IDs, citations, audience metadata, checked dates, and review-by dates in the source objects.
- `candidate-decisions.json`: explicit dispositions and public fact mappings for all 19 Japan candidates.
- `source-access-log.json`: direct-request evidence metadata. State Department command-line requests were denied; their public pages were reviewed with the web tool instead. Search/web snapshots and retrieved source text are preserved privately in the local backup directory.
- `api-verification.json`: checks against every published country through the public API and checks that missing trip details hide conditional facts and long-work queries exclude short-tourism rules.
- Verified anonymous database access: 207 eligible published records across 24 countries; zero unpublished or `needs_review` facts exposed.
- Validated all 196 payload rows against the FastAPI fact response schema before writing.
- Complete pre-write fact/candidate backup and per-country SQL transactions are in the Git-ignored `data/candidates/publication-2026-11-05/` directory. Deterministic new IDs permit idempotent writes. The local backup is required for rollback; it is not part of the committed research artifacts.

Reviewer: Codex performed source review and rewriting. Publication authorization: explicit project-owner request in this chat. No human reviewer identity was invented; `created_by`/`reviewed_by` Auth foreign keys were not populated with a fabricated user. Review-by metadata does not yet enforce expiration automatically in the public API.

## Published coverage

| Country slug | Published facts | Categories covered | Remaining category gaps |
|---|---:|---:|---|
| algeria | 6 | 6 | arrival, culture, getting-around, phones |
| argentina | 8 | 7 | arrival, getting-around, phones |
| australia | 6 | 6 | arrival, culture, getting-around, phones |
| austria | 9 | 8 | culture, phones |
| belgium | 7 | 6 | arrival, culture, getting-around, phones |
| bosnia-and-herzegovina | 7 | 6 | culture, electricity, getting-around, phones |
| egypt | 8 | 8 | arrival, phones |
| england | 9 | 8 | culture, phones |
| france | 9 | 8 | culture, getting-around |
| germany | 9 | 8 | culture, getting-around |
| iraq | 6 | 6 | arrival, culture, getting-around, phones |
| japan | 16 | 10 | None |
| mexico | 7 | 6 | arrival, culture, getting-around, phones |
| netherlands | 6 | 5 | arrival, culture, electricity, getting-around, phones |
| new-zealand | 6 | 6 | arrival, culture, getting-around, phones |
| norway | 9 | 8 | arrival, phones |
| panama | 10 | 9 | arrival |
| paraguay | 10 | 9 | phones |
| qatar | 8 | 8 | arrival, getting-around |
| saudi-arabia | 8 | 8 | arrival, culture |
| scotland | 11 | 10 | None |
| senegal | 10 | 9 | culture |
| south-africa | 10 | 9 | culture |
| south-korea | 12 | 10 | None |
