# Collection and accuracy review — November 3, 2026

**Audience:** U.S. passport holders. **Status at audit time:** Collection audit complete for listed URLs; fact verification incomplete. No country guide was then newly approved for traveler display.

**Current-state addendum — November 4, 2026:** After the audit, 12 South Korea fact rows were added to Supabase at the user's request. Eleven remain published. Publication status records the earlier approval; it does not mean this broader source audit has completed claim-by-claim verification. The cash-declaration row is unpublished and `needs_review` because Korea Customs requires reporting above US$10,000 equivalent while the current U.S. State Department page says no cash declaration is needed. The disagreement is unresolved; the row must stay hidden. See [Korea Customs](https://www.customs.go.kr/english/cm/cntnts/cntntsView.do?cntntsId=5500&mi=10800) and [State Department](https://travel.state.gov/en/international-travel/travel-advisories/south-korea.html).

On November 4, all source objects in the 19 existing Japan candidates and 12 South Korea facts received RoamReady scope-role metadata. Source check dates were preserved unless a page was reopened. South Korea’s arrival fact now flags the cash-rule disagreement; its health fact adds the [Korean Ministry of Food and Drug Safety permit guidance](https://www.mfds.go.kr/eng/brd/m_60/view.do?seq=72497), and its safety fact adds [Korea Meteorological Administration severe-weather alerts](https://www.weather.go.kr/neng/forecast/warning.do). This classifies source roles; it does not verify every associated claim.

## Collection results

- All **491 distinct URLs** in all rows of the four supplied source-bank CSVs have a recorded request attempt, across **24 destinations**. This includes research-note and main-source rows, not only the ten topic rows.
- **632 total URLs** were attempted including supplements. The first pass omitted 60 bank URLs; those have now been processed.
- All four accessible PDFs had text extracted: **252 pages total**. Selected Qatar insurance and SARS currency pages were also rendered and visually inspected. Extraction of a long PDF is not a complete legal review.
- [Collection summary](collection-summary.json) gives machine-readable coverage, source-bank hashes and outcome totals. [Source access log](source-access-log.json) records each attempt, final URL, publisher/page title when available, country/topic references, text hash and verification state.
- The audit records extracted text and four PDFs under the Git-ignored `data/candidates/research-2026-11-03/source-cache/`. On November 4, 2026, that directory was not present in the checked workspace, so the extracted bodies could not be re-opened here. The source-bank CSVs also were not present in the checked workspace. Git contains hashes and evidence metadata, not complete third-party page bodies.

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

## Source value for RoamReady’s scope — reviewed November 4, 2026

The source mix is suitable as a **research lead set**, but the links are not equally suitable as evidence for traveler-facing facts. Prefer a source that owns the rule or service, then cross-check its applicability to U.S. passport holders.

| Topic | Keep as primary evidence | Use as supporting context only |
|---|---|---|
| Entry, visas, customs | Destination immigration, foreign ministry, customs, and embassy/consulate pages; U.S. State Department for a U.S.-citizen cross-check. | Tourism visa finders can help locate a route, but should not decide legal eligibility when official immigration sources disagree or are silent. |
| Safety and emergencies | U.S. State Department country page and U.S. mission contact details; destination emergency, police, and weather authorities for local instructions. | UK FCDO, Canadian travel advice, and other governments can add a second perspective, but their nationality, consular, and risk framing differs from RoamReady’s U.S.-passport audience. |
| Health and medicines | CDC Traveler View and notices for U.S. travel-health advice; destination health/drug authority for import permits and controlled ingredients. | A tourism page or a general health homepage does not establish a personal vaccine recommendation or medicine’s import legality. |
| Transport | Airport, rail, bus, ferry, and transit operators for routes, fares, service alerts, and official apps. | Tourism-board roundups are useful indexes; confirm each listed app’s current official store listing, payment function, platform, and geographic scope. City pages must stay labelled by city or region. |
| Money | Central bank for currency context, destination customs for declarations, and U.S. CBP for U.S. border reporting. | Commercial converters can provide a timestamped estimate, not an official peg or the traveler’s transaction rate. State Department summaries may be useful but can omit detailed thresholds or conflict with customs pages. |
| Culture | Official tourism and venue pages for practical customs, clearly labelled as custom, law, or facility rule. | Encyclopedias such as Britannica can support broad background, not changing rules or universal etiquette claims. |
| Phones and electricity | Local telecom operators/regulators for network and package details; utilities/standards authorities for voltage, frequency, and plug rules. | Airalo/Holafly product pages establish what those vendors advertise for a plan, not independent countrywide coverage. WorldStandards can corroborate plug details, but should not be the sole technical authority when a local source is available. |

The five monitored GOV.UK FCDO feeds are valuable for **UK-government safety change monitoring** because their public API, open licence, and collection rules are clear. The collector correctly retains `jurisdiction: United Kingdom` and queues content privately. They must not establish U.S. visa eligibility, U.S. consular contacts, or a U.S. travel-advisory level, and their output must remain unpublished until a reviewer compares it with U.S. and destination sources.

Reject a page as evidence when it redirects to a generic store or unrelated country, returns only an app shell, is blocked, or contains only a homepage without the needed claim. The Iraq Holafly redirect is explicitly rejected. A successful fetch or text extraction proves only that content was obtained; it does not prove that the content is current, applies to a U.S. passport, or supports the nearby claim.

The bank’s **491 URLs were all attempted** in the November 3 collection pass. Text was extracted from 332 bank pages and four bank PDFs; 155 bank requests were blocked, failed, or returned only limited/app-shell text. The 336 readable extracts are marked “needs review,” not “verified.” The original CSVs and the ignored raw-source cache were not present in the checked workspace on November 4, so the run cannot currently be reproduced from the project checkout alone.

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
| South Korea cash | [Korea Customs foreign-currency declaration](https://www.customs.go.kr/english/cm/cntnts/cntntsView.do?cntntsId=5500&mi=10800) and [State Department country page](https://travel.state.gov/en/international-travel/travel-advisories/south-korea.html), opened November 4, 2026. | Korea Customs requires reporting above US$10,000 equivalent on arrival; State says no entry/exit declaration is needed. Neither source silently overrides the other. The Supabase money fact was unpublished and set to `needs_review`; keep it hidden pending reconciliation. |

## Checks performed before Git synchronization

- Complete source-bank URL coverage and unique source records checked.
- All 24 supplements have the ten required topic headings.
- Local Markdown links and machine-readable JSON checked.
- Source bodies and local environment files excluded from the commit; only evidence metadata and research documents included.
- Existing country drafts, both Japan references, and the pre-existing untracked Word portfolio preserved.

## Remaining work

The collection step is complete for the supplied URL inventory. The request to make **all information accurate** is not complete: blocked sources, conflicting official statements, conditional rules and unreviewed facts remain. No record is labelled fully verified. The comprehensive traveler-facing prose expansion requested earlier also remains unfinished. The pushed material is a research audit and source supplement, not launch-ready guidance.

The source-collection audit itself made no Supabase writes. Its publication statement describes the audit-time state; see the current-state addendum above for the subsequent South Korea change.
