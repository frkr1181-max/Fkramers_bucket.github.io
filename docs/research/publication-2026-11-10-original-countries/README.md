# Remaining original-country research publication

Published **282 nonduplicate additions** for the original country collection; Japan’s original follow-up records were already integrated. Australia now has **28 published facts**, up from 10. The full dropdown collection contains **857 facts across 36 destinations**.

| Original destination | Added facts |
|---|---:|
| algeria | 11 |
| argentina | 13 |
| australia | 18 |
| austria | 12 |
| belgium | 12 |
| bosnia-and-herzegovina | 13 |
| egypt | 13 |
| england | 13 |
| france | 12 |
| germany | 14 |
| iraq | 12 |
| mexico | 15 |
| netherlands | 13 |
| new-zealand | 14 |
| norway | 13 |
| panama | 12 |
| paraguay | 11 |
| qatar | 9 |
| saudi-arabia | 11 |
| scotland | 13 |
| senegal | 11 |
| south-africa | 11 |
| south-korea | 6 |

## Scope and decisions

Every one of the 380 records in the November 9 follow-up pack has an explicit disposition in `review-decisions.json`. Supported summaries are linked to source-backed published records, exact duplicate notes are merged, Japan records point to their existing integration, and Pocket Wi-Fi outside Japan is omitted as requested. Unresolved research and design-adaptation notes are not facts and are not relabeled as established guidance. The rail/bus notes whose sources did not establish the claimed passenger service were rejected. General payment checklists already covered by saved money facts were not duplicated.

The source pack records November 9 source inspection. Imported summaries keep that original verification date rather than treating publication as a new verification. `source-audit.json` records November 10 retrieval checks for 193 relevant source URLs. Search/open failures were followed up with official source discovery; replacement citations are in the payload. Source accessibility alone was not treated as proof of every historical claim. Prior legal/medical scopes were retained: no UK healthcare eligibility or UK driving-license rights were transferred to U.S. visitors.

Australia received additional direct checks against Home Affairs ETA conditions, TGA medicine rules, Border Force Tourist Refund Scheme rules and Sydney/Melbourne airport transport pages. Its new ETA/passport, medicine, refund and transport summaries have November 10 dates. Imported local/venue advice retains its location scope. Netherlands export validation explicitly reflects its digital process from 2026.

## Display

Each addition has an explicit topic mapping. No passage is repeated across cards within the same guide. Medicine can be reached from Entry and Health, as designed. Empty placeholder cards are omitted from public guides; unsupported details remain recorded in the research decisions rather than shown as filled-out information. The site does not claim that every conceivable topic or trip condition is exhaustively covered. Tax-refund unavailability in Great Britain, New Zealand and Qatar is explained with currency/tax information rather than advertising an unavailable refund option.

## Preservation and verification

All 575 pre-existing database rows remain byte-for-byte unchanged; their sorted-row fingerprint is `3810493986f147e8c0db0bcbc1e23f4f` before and after publication. The pre-publication snapshot is retained in the ignored candidates directory. Only INSERT with deterministic IDs and ON CONFLICT DO NOTHING was used. No rows, original research files, accounts or trips were deleted.

All 282 additions were checked through the live five-day-tourism API for country isolation, wording, sources and dates. Australia returns 28 facts. The static snapshot includes all 857 facts and the Pages release refreshes its data URLs. Six frontend check suites and 27 backend tests passed. See `api-verification.json`, `facts.json`, `topic-mapping.json`, `review-decisions.json` and `source-audit.json`.
