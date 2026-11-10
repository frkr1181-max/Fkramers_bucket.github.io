// the guest trip. nothing is saved to an account or to browser storage: the trip
// lives in this page's memory and in the address bar (#/trip?country=japan&...),
// so a refresh keeps the plan and closing the tab forgets it. the optional
// description stays in memory only, since it can be personal.

import { purposeById } from "./guides.js";

const FIELDS = ["country", "from", "to", "purpose", "name"];
let description = "";

export function tripFromQuery(query) {
  const params = new URLSearchParams(query);
  const trip = Object.fromEntries(FIELDS.map((field) => [field, params.get(field) || ""]));
  if (!purposeById(trip.purpose)) trip.purpose = "";
  return trip.country ? { ...trip, description } : null;
}

export function tripToQuery(trip) {
  const params = new URLSearchParams();
  for (const field of FIELDS) if (trip?.[field]) params.set(field, trip[field]);
  return params.toString();
}

export function rememberDescription(text) {
  description = text;
}

function parseDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

// inclusive trip length in days, or null when the dates aren't set
export function tripDays(trip) {
  const start = parseDay(trip.from);
  const end = parseDay(trip.to);
  if (start === null || end === null || end < start) return null;
  return Math.round((end - start) / 86_400_000) + 1;
}

const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

// "Mar 15 – Mar 28, 2027", the one date format the hi-fi uses
export function formatRange(trip) {
  const start = parseDay(trip.from);
  const end = parseDay(trip.to);
  if (start === null || end === null) return "Dates not set";
  const sameYear = new Date(start).getUTCFullYear() === new Date(end).getUTCFullYear();
  return `${sameYear ? monthDay.format(start) : fullDate.format(start)} – ${fullDate.format(end)}`;
}

// what the facts API needs to filter conditional facts for this trip
export function factQuery(trip) {
  // the API accepts 1 to 36500 days; a typo like 2127 for 2027 stays in range
  const days = tripDays(trip) === null ? null : Math.min(tripDays(trip), 36500);
  return {
    stayMin: days,
    stayMax: days,
    purpose: purposeById(trip.purpose)?.api ?? null,
  };
}
