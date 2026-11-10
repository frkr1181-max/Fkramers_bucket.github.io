# Previously empty destination guides — November 10, 2026

Published **259 additional facts** across the twelve dropdown destinations that previously had none. All 36 dropdown destinations now have published information across all ten data categories, with 575 facts in the saved collection. Each new country has 20–24 facts and approximately 550–750 words of focused guidance.

| Destination | New facts |
|---|---:|
| brazil | 21 |
| cabo-verde | 20 |
| canada | 20 |
| colombia | 20 |
| croatia | 23 |
| czechia | 23 |
| spain | 23 |
| sweden | 24 |
| switzerland | 23 |
| turkiye | 21 |
| uruguay | 21 |
| uzbekistan | 20 |

## Research and review

Reviewed government border/consular guidance, CDC Traveler Views, FCDO country health and local-conditions pages, airport/transport operators, telecom providers, official tourism information and Electrical Safety First. The fact payload cites 127 distinct source URLs. Audience: ordinary U.S.-passport visitors. UK entry rules, driving-license entitlements, NHS access and European health-card entitlements were not applied to U.S. travelers. Codex performed source review; no human reviewer identity was invented.

Facts cover passport/visa checks, arrival declarations or registration, currency and payment methods, SIM activation, electrical compatibility, vaccines and itinerary-dependent risks, medicines, healthcare/evacuation, locally scoped airport/transport options, advisories, hazards, emergency numbers and local legal precautions. Providers’ advertised plans are described as offers with conditions, not guarantees. No live exchange rates, fares, schedules or prices were fabricated.

## Specific decisions

- Brazil: advance visitor e-Visa required for U.S. passports; signed passport/two free pages checklist; e-DBV reporting; regional voltage differences and a conflicting airport Wi-Fi-duration statement are preserved accurately.
- Cabo Verde: thirty-day U.S. tourist exemption and EASE guidance from its embassy; no static airport tax amount promoted from old PDFs; island-specific transfer and healthcare limits retained.
- Canada: U.S.-passport visa/eTA exemption, discretionary visitor stay and optional Advance CBSA Declaration. No assumption that foreign visitors qualify for provincial healthcare.
- Colombia: current CheckMig service instructions describe it as optional/free, unlike some older FAQ wording. Current service guidance governs the published fact. Yellow-fever and malaria advice remains itinerary-specific.
- Croatia, Czechia, Spain, Sweden and Switzerland: short-stay Schengen counting retained. EES and ETIAS are separate facts; the official check-date ETIAS FAQ says it is not operating. Cash reporting distinguishes EU territory from Switzerland.
- Switzerland: Swiss authorities’ three-month-after-departure passport wording differs from the U.S. page’s six-month-from-entry statement. Both are named; borderline documents require authority/airline confirmation. Ambulance 144 is sourced from health guidance rather than the inconsistent U.S. country-page number.
- Türkiye: ordinary-passport tourist exemption, separate local SIM identity process and warning about restricted access to some eSIM services.
- Uruguay: tourist/resident cannabis rules distinguished; local prescriptions and rural medicine limits retained.
- Uzbekistan: current thirty-day U.S. visa-free policy, hotel/place-of-stay registration, passport-validity source disagreement and passport-matched railway tickets.

## Integration and limits

Every fact has an explicit topic assignment in `topic-mapping.json`. Medicine is intentionally available from both Entry and Health, as in the design; there are no repeated passages across cards inside the same guide. Existing country facts were not altered. Both the live API and static fallback include the additions. Future changed live records remain visible in Planning overview until their mapping is reviewed again.

This is substantial practical guidance, not a claim that every one of the 32 design subtopics is fully researched. Pocket Wi-Fi cards are omitted outside Japan unless published local rental information exists. Unsupported tax-refund details and second-airport examples remain unavailable rather than filled with generic or unrelated claims. See the country-topic coverage report.

## Verification and preservation

All 259 payloads passed the API schema and exact live response checks. Every new destination returns all ten categories for a five-day tourism trip; missing-purpose and long-work requests exclude short-tourism permission. Five frontend suites and 27 backend tests passed. Before publication the original 316-record collection was backed up under the ignored candidates directory. Database publication used only INSERT with deterministic IDs and ON CONFLICT DO NOTHING; no UPDATE, DELETE, schema or policy changes. The existing-record fingerprint remained unchanged.

Files: `facts.json`, `topic-mapping.json`, `review-decisions.json`, `source-discovery.json`, `api-verification.json`, `verification.json`.
