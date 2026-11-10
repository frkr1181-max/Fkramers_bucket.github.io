// the adapter between the design and the data.
// the database has 10 fact categories and 7 trip purposes; the hi-fi has 8 guides
// and 4 purposes. this file is the only place that knows both, so neither side
// has to rename anything. see ADR-001-coded-site.md for why.

const ICONS = "assets/figma/";

// the 8 guides in the order the hi-fi shows them, grouped by trip stage
export const GUIDES = [
  { id: "entry", stage: "plan", title: "Entry & documents", categories: ["entry"],
    blurb: "Visas, passport rules, arrival forms and what you can bring." },
  { id: "money", stage: "plan", title: "Money & payments", categories: ["money"],
    blurb: "Local currency, cards, cash and ATM fees." },
  { id: "phones", stage: "plan", title: "Phones & tech", categories: ["phones", "electricity"],
    blurb: "eSIMs, Wi-Fi, plugs and voltage." },
  { id: "health", stage: "plan", title: "Health", categories: ["health"],
    blurb: "Insurance, vaccines, pharmacies and medicine rules." },
  { id: "there", stage: "arrive", title: "Getting there", categories: ["arrival"],
    blurb: "Airports, arrival steps and getting into the city." },
  { id: "around", stage: "arrive", title: "Getting around", categories: ["getting-around"],
    blurb: "Trains, buses, transit cards and taxis." },
  { id: "safety", stage: "know", title: "Safety", categories: ["safety", "emergency"],
    blurb: "Travel advisories and emergency numbers." },
  { id: "culture", stage: "know", title: "Local culture", categories: ["culture"],
    blurb: "Etiquette, tipping, customs and local laws." },
].map((guide) => ({
  ...guide,
  color: `var(--rr-guide-${guide.id})`,
  tint: `var(--rr-guide-tint-${guide.id})`,
  icon: `${ICONS}tile-${guide.id}.svg`,      // 48px icon for dashboard tiles
  // 48px navy icon on the pale topic-card tint. entry's tile icon is white (it sits
  // on dark teal), so its cards use the navy document icon from the Entry guide
  topicIcon: guide.id === "entry" ? `${ICONS}topic-document.svg` : `${ICONS}tile-${guide.id}.svg`,
  swatch: `${ICONS}swatch-${guide.id}.svg`,  // 18px white icon for the plan preview
}));

export const STAGES = [
  { id: "plan", label: "Plan" },
  { id: "arrive", label: "Arrive" },
  { id: "know", label: "Know" },
];

export function guideById(id) {
  return GUIDES.find((guide) => guide.id === id);
}

// which guide a fact belongs to, from its database category
export function guideForCategory(category) {
  return GUIDES.find((guide) => guide.categories.includes(category));
}

// the design's 4 purposes. `api` is what gets sent as ?purpose= to
// GET /api/destinations/{slug}/facts. Emergency has no matching purpose in the
// data, so it sends none and the API returns only the general facts.
export const PURPOSES = [
  { id: "leisure", label: "Leisure", api: "tourism", icon: `${ICONS}purpose-leisure.svg` },
  { id: "work", label: "Work", api: "work", icon: `${ICONS}purpose-work.svg` },
  { id: "study", label: "Study", api: "study", icon: `${ICONS}purpose-study.svg` },
  { id: "emergency", label: "Emergency", api: null, icon: `${ICONS}purpose-emergency.svg` },
];

export function purposeById(id) {
  return PURPOSES.find((purpose) => purpose.id === id);
}

// group a country's facts into the 8 guides, keeping the API's order inside each
export function groupFacts(facts) {
  const groups = Object.fromEntries(GUIDES.map((guide) => [guide.id, []]));
  for (const fact of facts) {
    const guide = guideForCategory(fact.category);
    if (guide) groups[guide.id].push(fact);
  }
  return groups;
}

// emergency facts are written as "Police: 110. Ambulance or fire: 119. ..."
// pull out each "label: number" pair so the dashboard can show them as number
// rows. anything that doesn't match that pattern is left for the guide page.
export function emergencyNumbers(facts) {
  const numbers = [];
  for (const fact of facts.filter((f) => f.category === "emergency")) {
    const text = fact.plain_summary;
    for (const match of text.matchAll(/([A-Z][A-Za-z ,/()-]{2,40}?):\s*(\d{2,4}(?:\s?\d{2,4})?)\b/g)) {
      numbers.push({ label: match[1].trim(), number: match[2] });
    }
    // "Call 911 for emergencies." style
    if (!numbers.length) {
      const call = text.match(/\bCall (\d{2,4})\b/);
      if (call) numbers.push({ label: "Emergencies", number: call[1] });
    }
  }
  // the same number can appear twice when two facts mention it
  const seen = new Set();
  return numbers.filter((row) => !seen.has(row.number) && seen.add(row.number));
}
