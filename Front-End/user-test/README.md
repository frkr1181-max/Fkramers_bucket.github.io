# RoamReady HTML user-test mocks

Open `index.html` in a browser. No installation, database, credentials, or build is required. Keep the CSS and JavaScript beside the HTML. Outfit is loaded from Google Fonts when online; Arial is the offline fallback.

The default view is Home. Follow Start planning → Create my plan → topic cards. Direct entry points are `index.html#home`, `index.html#plan`, and `index.html#trip`.

## What is included

- Home and trip planning views based on the main flow in the supplied Figma reference.
- Dashboard adapted from the repository's `Front-End/test.html` export, with the same grayscale palette, Outfit typography, category cards, and checklist structure.
- All 24 countries and all ten research topics from the existing country drafts.
- The longer Japan research guide, with its existing research-check dates and sources.
- Country and purpose selection, exact or flexible dates, optional trip name/description, eight checklist items, source links, text trip summary, and JSON research/checklist download.
- Guest state in browser memory only. Refresh resets the trip and checklist. No backend calls or account changes.

## Content status

The country source-bank drafts were prepared November 1, 2026. That is NOT a fact-verification date. The existing Japan guide records research checks on October 28 and a health refresh on October 29; it still awaits review. The mock labels this content as draft research, rather than current verified guidance. No source pages were freshly checked for this implementation. Only supplied notes and links are used; no rates, prices, or travel requirements have been invented.

Trip purpose and dates describe the test trip; they do not automatically filter the research by eligibility. Country emergency links replace illustrative Japan-only contact numbers. Research downloads are JSON; this is not a service-worker offline web app or an account save. The profile control explains guest mode. A live AI assistant is not included.

## Design fidelity

The Figma file was viewed read-only and was not modified. Its Home, Plan a trip, and Trip dashboard frames were inspected. The connected Figma design-context tools were unavailable, so this is a reference-based implementation, not a verified pixel-exact reproduction. The exported dashboard's icon approximations are retained. Topic guides use dialogs, and Profile is a guest-state dialog. Responsive behavior and draft labels were added for usability. The home image is the gray crossed placeholder shown in the board.

## Suggested user-test tasks

1. Start from Home and plan a France trip with a chosen purpose and dates.
2. Find entry information and open one source link.
3. Find phone/internet and electricity information.
4. Complete two checklist items, then open the full checklist.
5. Edit the trip to another country and find its emergency sources.
6. Download the research and checklist, and describe what you expect the download to contain.

## Local preview

From this folder, run `python3 -m http.server 5510 --bind 127.0.0.1`, then open `http://127.0.0.1:5510`.

The source research lives in `/Users/frankiekramer/Desktop/RoamReady /docs/research/`. The copy in `countries.js` is a static snapshot. Changes to the research files do not automatically update these mocks.
