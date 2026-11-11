# Active RoamReady frontend

This is David's stable high-fidelity `site/`, imported from the `hifi-site` branch at `c2be951551535550401c585afd084f4e0ad69c6a`. Use this folder for all frontend integration work. The original ADR is retained as design context.

Run FastAPI from the repository root and open http://127.0.0.1:8000/ . FastAPI now serves this folder as well as `/api`. No frontend build is needed. For a separate preview, serve this directory on port 5500.

The existing guest journey reads published facts with trip-purpose and stay-length filters. Facts show citations and verification dates. A clearly labeled snapshot supports guide browsing when the backend is unavailable; Retry live guide reconnects. Account operations never fall back to a snapshot.

The homepage login and Sign up flow use the official Supabase Auth SDK. Your profile opens saved trips and logout. Save trip on the dashboard writes trip details and checklist completion to the existing `/api/trips` routes. A saved trip ID in the route is always resolved through the authenticated API; URL details do not grant access. The optional description stays in page memory and is explicitly excluded from account saving. Checklist changes require Save trip.

Sessions persist in this browser until logout; the Auth SDK refreshes tokens. Public configuration comes from `/api/auth/config`. No service-role key is included in client files. The vendored Auth SDK version, source, hash and license are in `js/vendor/`.

See [deployment instructions](../docs/DEPLOYMENT.md) and [verification](../docs/INTEGRATION_VERIFICATION.md). Older prototypes are preserved under `.archive/` and are not application entry points.

## Japan’s full topic structure

Japan uses all 32 designed subcards across the eight guides. Topic mapping uses only facts returned for the selected trip, including cross-category facts such as medicine under Entry. Learn more shows full published summaries, verification dates, conditions and citations. Eleven follow-up draft records and their shared preparation notes are connected to their topics with explicit draft labels, limits and source dates. Each guide also exposes the longer original Japan research in an expandable draft section. No research is automatically published and no database writes are needed for this mapping.

The reproducible research pack is built with `python3 site/tools/build_japan_subcards.py`. Run frontend checks using `npm test` from this folder (Node required). The build reads the existing research files and writes only `site/data/japan-subcards.json`.

The separate Narita international-arrivals research note is also linked under Narita Airport and Arrival steps; its search-result-only evidence limit remains visible.

### Reviewed October 29 material and publication

The [November 10 publication](../docs/research/publication-2026-11-10-japan/README.md) adds 28 reviewed records (44 Japan facts total), including supported October 29 detail and gap filling. All 32 subcards now have published support. Matching published records supersede their earlier draft display; original source research remains preserved in project documentation and is not shown as a separate website archive. The snapshot includes the new publication.

## Permanent topic pages

Learn more now links to `#/topic/<guide>/<topic>?<trip details>`, with a complete detail page rather than a dialog. Japan uses its 32 mapped subcards; other countries use their published fact IDs. The detail page includes full summaries, original excerpts where present, verification dates, source links, neighboring topics, and links back to the guide and trip. Browser back, bookmarking and refresh work with the topic route. Saved-trip topic URLs go through the same account/ownership check as the dashboard. Account dialogs are separate from guide details.

## Topic relevance

`data/japan-topic-mapping.json` explicitly assigns facts to their intended topic, replacing the broad keyword baseline. Visa excludes the mixed passport fact; Passport shows only its passport-related passage, retaining the original source and date. Money, technology, transport and culture cards omit unrelated/general duplicate facts. The full database facts and original research are preserved. No fact is repeated across different cards within the same guide. Medicine remains accessible in both Entry and Health, as specified by the design. The pack builder applies these placements reproducibly.

Passport/Visa expansion (2026-11-10): 15 additional officially sourced facts published, 59 Japan facts total. Seven Passport sections; eight additional Visa facts, with conditional work/study guidance filtered by trip purpose. Live five-day tourism response: 56 eligible facts. Existing data preserved. Backend tests: 27 passed; frontend topic and eligibility checks passed.

Original country research is integrated into the normal saved guide collection. The public archive panels have been removed. All 240 source sections across 24 researched destinations map to saved published facts; the static fallback now contains all 316 published records, including 11 restored South Korea records. Original research files remain intact. See [integration record](../docs/research/integration-2026-11-10/README.md).

All researched countries now use focused card/topic navigation. After rebuilding snapshots, run `python3 site/tools/build_country_topics.py` to refresh the non-Japan passage mappings. New or changed live facts remain visible in Planning overview until remapped. Missing subtopic details stay unavailable; no draft is automatically published. See the country-topic coverage and API verification files in the integration report.

November 10 missing-country publication: 259 additional source-reviewed facts across Brazil, Cabo Verde, Canada, Colombia, Croatia, Czechia, Spain, Sweden, Switzerland, Türkiye, Uruguay and Uzbekistan. All 36 dropdown destinations now have facts in all ten categories (575 total). New facts use explicit focused-topic mappings and existing trip filters. Original 316 records preserved. See docs/research/publication-2026-11-10-missing-countries/README.md for sources, limits and checks.

Country-specific applicability: non-Japan Pocket Wi-Fi cards are omitted unless a published local passage supports them. Japan retains its verified rental topic.

Original-country follow-up publication: 282 additional facts, 857 total, Australia 28. All 380 original follow-up records have a documented disposition. Empty public topic cards are omitted; existing 575 records and all original research are preserved. See docs/research/publication-2026-11-10-original-countries/README.md.
