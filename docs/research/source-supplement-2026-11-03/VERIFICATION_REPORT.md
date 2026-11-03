# Collection and accuracy review — November 3, 2026

**Audience:** U.S. passport holders. **Status:** Collection audit complete for listed URLs; fact verification incomplete. **No country guide is newly approved for traveler display.**

## Collection results

- All **491 distinct URLs** in all rows of the four supplied source-bank CSVs have a recorded request attempt, across **24 destinations**. This includes research-note and main-source rows, not only the ten topic rows.
- **632 total URLs** were attempted including supplements. The first pass omitted 60 bank URLs; those have now been processed.
- All four accessible PDFs had text extracted: **252 pages total**. Selected Qatar insurance and SARS currency pages were also rendered and visually inspected. Extraction of a long PDF is not a complete legal review.
- [Collection summary](collection-summary.json) gives machine-readable coverage, source-bank hashes and outcome totals. [Source access log](source-access-log.json) records each attempt, final URL, publisher/page title when available, country/topic references, text hash and verification state.
- Full extracted text and the four PDF files are retained locally under `data/candidates/research-2026-11-03/source-cache/`. This location is Git-ignored. Git contains the research supplement and evidence metadata, not complete third-party page bodies.

| Terminal collection result | All URLs | Bank URLs |
|---|---:|---:|
| blocked or gateway | 6 | 4 |
| limited text or app shell | 19 | 14 |
| pdf text extracted needs review | 4 | 4 |
| request failed | 162 | 137 |
| text extracted needs review | 440 | 332 |
| wrong destination redirect | 1 | 0 |

Selected official pages were also read through web browsing after terminal failures. That separate success is noted per source. Terminal failures remain visible rather than being relabelled as successful scrapes.

## Accuracy findings and open conflicts

| Item | What was checked | Decision for research |
|---|---|---|
| Qatar entry | [State country page](https://travel.state.gov/en/international-travel/travel-advisories/qatar.html) and [Visit Qatar visa page](https://visitqatar.com/intl-en/practical-info/visas/visa-details), checked 2026-11-03. | State gives conflicting passport periods. Tourism information also describes a different U.S.-visa validity period. MOI returned a rejection page. Keep passport and visa-validity claims unresolved; distinguish visa validity from allowed days per visit. |
| Qatar visitor insurance | [Ministry of Public Health visitor guide](https://www.moph.gov.qa/english/departments/ministeroffice/hfid/Documents/Visitor-Guide-to-Medical-Care-in-Qatar-English.pdf), page 3, checked 2026-11-03. | The guide distinguishes prior-visa visitors, extensions, and visa-on-arrival visitors. Do not turn it into an unconditional rule for every U.S. tourist. Confirm current application to the specific trip. |
| South Africa customs | [SARS online declaration FAQ](https://www.sars.gov.za/travellerdeclaration/faqs-for-the-required-online-traveller-declarations-from-1-july-2026/) and [currency policy](https://www.sars.gov.za/wp-content/uploads/Ops/Policies/SC-PA-01-06-Excess-Currency-External-Policy.pdf), checked 2026-11-03. | FAQ describes the July 2026 declaration process and assistance for travelers unable to file beforehand. Currency policy has direction, currency-type and Common Monetary Area distinctions. Do not reduce these rules to a single cash threshold. |
| Saudi electrical supply | [Saudi grid code](https://www.se.com.sa/-/media/sec/About-Us/National-Grid-SA/Saudi-Arabian-Grid-Code-Guide/English/2nd-SAGC-Electronic-Update-as-of-October-31-2016.ashx), extracted 2026-11-03. | This 224-page transmission-system document is not a sufficient source for current household socket voltage. Retain the consumer-source disagreement for review. |
| Holafly Iraq | [Attempted Iraq product URL](https://esim.holafly.com/esim-iraq/), checked 2026-11-03. | Redirected to the general store. Rejected as evidence of Iraq coverage. |
| Medicines | Destination-authority pages in each country supplement, checked 2026-11-03. | Incoming visitors, outgoing residents, medicines in luggage, postal imports and controlled ingredients are separate cases. Egypt's outbound alert does not resolve incoming U.S.-visitor permission. Several countries still lack ingredient-specific authority confirmation. |
| Health | Direct CDC Traveler View sources are retained in every country supplement. | CDC notices and vaccine recommendations require claim-level clinical review. Global notices must remain labelled global. A source appearing on a page is not a personal recommendation. |
| Weather and emergency help | National weather/hazard and consular leads were checked for access. | Empty apps and reachable homepages do not establish forecast content or validate emergency numbers. Country/region, warning issue time and exact contact sections still need review. |

## Checks performed before Git synchronization

- Complete source-bank URL coverage and unique source records checked.
- All 24 supplements have the ten required topic headings.
- Local Markdown links and machine-readable JSON checked.
- Source bodies and local environment files excluded from the commit; only evidence metadata and research documents included.
- Existing country drafts, both Japan references, and the pre-existing untracked Word portfolio preserved.

## Remaining work

The collection step is complete for the supplied URL inventory. The request to make **all information accurate** is not complete: blocked sources, conflicting official statements, conditional rules and unreviewed facts remain. No record is labelled fully verified. The comprehensive traveler-facing prose expansion requested earlier also remains unfinished. The pushed material is a research audit and source supplement, not launch-ready guidance.

Git synchronization covers this folder only. No Supabase write or traveler-facing publication is authorized or performed by this audit.
