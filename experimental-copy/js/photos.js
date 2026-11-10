// which background photo each page uses.
//
// two kinds of photo:
//   universal: 3 travel photos that belong to RoamReady itself, for pages that
//              aren't about one country (Home, Sign up, Plan a trip, About)
//   country:   up to 4 photos per country, spread over that country's pages:
//                main    the trip dashboard
//                plan    the Plan guides   (Entry, Money, Phones, Health)
//                arrive  the Arrive guides (Getting there, Getting around)
//                know    the Know guides   (Safety, Local culture)
//
// files live in assets/photos/:
//   universal/hero.webp, universal/plan.webp, universal/arrive.webp
//   countries/<country slug>/main.webp, plan.webp, arrive.webp, know.webp
//
// a country doesn't need all 4. a missing slot repeats one of that country's
// other photos (its main one if it has it), and a country with no photos at
// all uses the universal ones, so a page never shows an empty band. country-photos.js lists which files exist; rebuild it
// with `python experimental-copy/tools/build_photos.py` after adding photos.

import { COUNTRY_PHOTOS } from "./country-photos.js";

const DIR = "assets/photos/";

export const UNIVERSAL = {
  hero: `${DIR}universal/hero.webp`,     // Home and Sign up
  plan: `${DIR}universal/plan.webp`,     // Plan a trip, No trip yet, About
  arrive: `${DIR}universal/arrive.webp`, // the photo beside the sources on Home
};

// which universal photo stands in for each country slot
const STAND_IN = { main: "hero", plan: "plan", arrive: "arrive", know: "arrive" };

// slug is the country from the trip (it comes from the page URL), slot is one
// of main / plan / arrive / know. the slug is only ever used to look up our
// own list, never pasted into a path unless it's a country we have photos for
export function countryPhoto(slug, slot) {
  const have = Object.hasOwn(COUNTRY_PHOTOS, slug) ? COUNTRY_PHOTOS[slug] : [];
  // no slot is ever left empty (David, Nov 10): a missing one repeats another
  // of the country's photos, its main one first, otherwise whichever it has
  const pick = have.includes(slot) ? slot : have.includes("main") ? "main" : have[0] ?? null;
  return pick ? `${DIR}countries/${slug}/${pick}.webp` : UNIVERSAL[STAND_IN[slot] ?? "hero"];
}
