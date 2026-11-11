# Japan publication and gap fill — November 10, 2026

The project owner explicitly requested publication, removal of the two coverage/archive messages, inclusion of October 29 material, and a cross-check to fill missing Japan information. This batch adds 28 source-reviewed facts to the existing 16 Japan facts. Supabase now has 44 published Japan facts and 291 published facts overall. No existing fact, account, trip, or research record was deleted or overwritten.

## What was reviewed

The October 28–29 source-linked Japan notes were compared with the November 5 published facts, November 9–10 research, and the 32 subcard map. Previously covered claims were retained; gaps were written as separately sourced public facts rather than duplicating the entire draft. Original files and their original dates remain intact. New facts are marked verified November 10 because the current supporting sources were reviewed on that date; that does not change the original research date.

The 28 additions cover the twelve recent draft topics (including the supplemental Narita note) and older missing detail: Visit Japan Web, rail-pass restrictions, yen, ATMs, cards and IC cards, SIM/eSIM checks, Wi-Fi, electrical compatibility, CDC vaccination guidance, itinerary-dependent Japanese encephalitis advice, measles context, onsen/tattoos, local conduct, emergency help, etiquette and buses. The linked sources include the responsible Japanese agencies, airports and transport operators, JNTO, CDC, the U.S. State Department, FCDO local-conditions guidance and the device/provider sources relevant to the specific claim.

The old train-page citation for bus/taxi drafts was replaced with actual Narita bus/taxi information. The broken Haneda source was replaced with the airport's working access page. The search-only Narita note was checked against the full official arrivals procedure. Current Japan Customs information confirms the refund method for purchases from November 1, 2026. CDC's linked measles notice is described as global rather than a Japan-only outbreak. The old blanket health-disease list was not copied as a current list where the current page differs.

## Limits retained in the facts

Airport and Tokyo subway examples remain location-specific. No live exchange rate, fare, departure time, provider stock, personalized vaccine recommendation or individual medicine permission was invented. UK-specific passport/healthcare entitlements were not applied to U.S. travelers. Provider-listed coverage does not establish reception on every route. The published statements include the practical checks required for these variable details.

## Evidence and verification

- `facts.json`: exact 28-row publication payload, deterministic IDs, publication status, dates and fact-specific citations.
- `review-decisions.json`: origin and publication decision for every addition. Reviewer: Codex performed source review; no human reviewer identity was fabricated.
- `subcard-mapping.json`: additions linked to 29 topic slots; the three remaining slots already have published Visa, Passport and Travel advisory material.
- `api-verification.json`: live five-day tourism API check, all 28 additions present, and published supporting facts in all 32 subcards. Ineligible work/long-stay facts remain excluded.
- Before publication, the existing Japan fact records were preserved in the Git-ignored `data/candidates/publication-2026-11-10-japan/pre-publication-backup.json`.

Only INSERT was used, with deterministic IDs and `ON CONFLICT DO NOTHING`; there were no UPDATE, DELETE, policy or schema changes. Source-linked original research remains in the historical accordion. Once a topic's reviewed additions are returned by the API, their superseded draft notes are not displayed as pending review. The snapshot builder includes this publication batch so fallback browsing includes the same Japan additions.

Original preparation instructions are retained for provenance; they are not blanket approvals for every unexamined statement in old notes. The public facts above are the reviewed and approved claim set.

## Passport and Visa expansion — November 10

Added 15 source-reviewed facts: seven Passport sections and eight Visa sections. Published Japan facts now total 59. Existing records and original research were preserved; this batch used insert-only publication with deterministic IDs. The pre-publication backup is retained under the ignored candidates directory.

`entry-expansion-facts.json` contains the publication payload and fact-specific official citations. `entry-expansion-mapping.json` records topic assignments. Sources include the Embassy of Japan in the United States, Japan MOFA, and U.S. State Department passport and Japan guidance. Verification date: November 10, 2026.

Passport covers validity, blank pages, damage, reported loss, online renewal, connections and carrying original identification. Visa adds onward travel/funds, admission versus visa approval, entry windows versus permitted stays, residence jurisdiction, processing time, nationality, airside transit and Certificates of Eligibility. Work/study/long-stay content remains conditional.

The live five-day tourism API returned 56 eligible facts, including all 14 new general facts and excluding the new conditional COE fact. Topic checks confirm seven Passport sections, no shared fact IDs between Passport and Visa, and no repeated fact across cards within each guide. All 27 backend tests and frontend checks passed. See `entry-expansion-api-verification.json`.

## Arrival documents expansion — November 10

Published ten additional arrival-document facts, bringing Japan to 69 published facts. `arrival-expansion-facts.json` records the exact insert-only payload, official citations and verification dates. The Arrival forms topic now contains twelve focused sections, including its two existing facts. Original facts and historical research are retained unchanged.

Sources: Digital Agency Visit Japan Web setup guide; Immigration Services Agency arrival-record guidance (Japanese page, reviewed in the browser); Japan Customs electronic/paper declaration guidance, official English C-5360-B form, passenger-clearance channels and unaccompanied-articles FAQ. Covered requirements include ED records, individual immigration QR codes, regeneration after corrections, paper alternatives, flight/accommodation details, mandatory customs declarations, terminal/passport use, red/green channels and certification for unaccompanied baggage. No unsupported guaranteed processing times or entry approval were added.

The live five-day tourism API returned 66 eligible facts including all ten additions. Frontend checks confirm twelve Arrival forms sections, no facts shared with Passport or Visa, and no repeated fact across cards in each guide. All 27 backend tests passed. Evidence: `arrival-expansion-api-verification.json`. No UPDATE, DELETE, schema or policy change was used.
