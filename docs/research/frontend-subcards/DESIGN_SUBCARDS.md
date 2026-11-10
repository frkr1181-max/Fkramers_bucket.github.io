# Confirmed frontend design subcards

Inspected November 9, 2026, read-only in [RoamReady Prototype — High-fidelity Layout](https://www.figma.com/design/7RuFPAisyGxl2L8oGbZ55Z/RoamReady-Prototype?node-id=312-267).

The design contains eight guide sections, each with four `Learn more:` frames. The names below are transcribed from the expanded Figma layer tree, not inferred from dashboard descriptions. This supersedes the earlier 30-subcard interpretation.

| Guide | Exact Learn more frame labels |
| --- | --- |
| Entry & documents | Visa; Passport; Arrival forms; Medicine |
| Money & payments | Currency; Cash & ATMs; Cards & IC cards; Tax-free shopping |
| Phones & tech | eSIM; Pocket Wi-Fi; Free Wi-Fi; Plugs & voltage |
| Health | Travel insurance; Vaccines; Medicine rules; Doctors & pharmacies |
| Getting there | Narita Airport; Haneda Airport; Arrival steps; Buses & taxis |
| Getting around | Subway; JR trains; Buses; Taxis |
| Safety | Travel advisory; Emergency numbers; Earthquakes; Solo travel |
| Local culture | Etiquette; Tipping; Onsen & tattoos; Local laws |

## Why these were missing from the earlier review

The current checkout is `main`. The newer frontend exists on `origin/hifi-site`, under `site/`. Its `site/ADR-001-coded-site.md` explicitly contrasts the design's four hand-written topics per guide with the implementation's one card per published fact. Its `site/README.md` lists the 32 hand-written Learn more pages as not built yet. The local HTML exports do not contain those full nested designs.

The Figma connector reported a plan tool-call limit. The file was inspected through the existing signed-in browser instead; no upgrade request, design edit, or comment was submitted.

## Proposed country-level adaptations

These are research labels, not changes to the design:

- **Narita Airport / Haneda Airport:** primary and alternative arrival airport for the relevant trip. Research two relevant airports where appropriate; do not imply every destination has two comparable gateways. Airport selection needs the traveler's actual route. Ground transport must retain airport and city scope.
- **JR trains:** national and regional rail operators. If relevant passenger rail is unavailable or unsuitable, explain that only with a supporting source; do not replace it with invented train advice.
- **Earthquakes:** retain earthquake guidance where supported and research other relevant natural hazards. A broader “Natural hazards” label would need a design decision.
- **Onsen & tattoos:** retain for Japan; research relevant bathing, dress, religious-site, and other venue rules elsewhere. These customs are not interchangeable; the final label should reflect the actual content.
- **Cards & IC cards:** payment cards and supported local stored-value/transit cards. Do not assume a Japanese IC-card system exists everywhere.
- **Medicine / Medicine rules:** the design includes both. They can reference the same verified medicine guidance while maintaining their separate places in the navigation.

## Research coverage

> Follow-up research for all 380 originally unmatched slots is complete: [new drafts and unresolved details](research-2026-11-09/README.md). The figures below retain the initial mapping baseline.

The regenerated pack has 768 country/subcard combinations. Existing dated guide facts provide keyword-matched supporting information for 388; 380 have no matching published fact. Even a match may only answer part of a subcard. These counts exclude the three new airport research notes, which remain separate drafts.

There are no matching published notes for tax-free shopping or pocket Wi-Fi in any of the 24 country guides. New source research is still required; the pack is not a completed or newly verified 32-subcard guide for every country.
