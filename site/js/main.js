// page shell: a small hash router and the five views (home, plan, trip, guide, about).
// every piece of text from the database goes through esc() before it reaches the page.

import { getDestinations, getFacts, onSourceChange } from "./api.js";
import { GUIDES, STAGES, PURPOSES, guideById, groupFacts, emergencyNumbers, purposeById } from "./guides.js";
import { tripFromQuery, tripToQuery, rememberDescription, tripDays, formatRange, factQuery } from "./trip.js";

const main = document.querySelector("#main");
const A = "assets/figma/";
const PHOTO = { street: "assets/photos/street.webp", plan: "assets/photos/plan-street.webp", arrivals: "assets/photos/arrivals.webp" };

let trip = null;               // the current guest trip, or null
let destinations = [];         // [{ slug, name, ... }] from the API or the snapshot
const done = new Set();        // checklist items ticked in this tab

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const countryName = (slug) => destinations.find((d) => d.slug === slug)?.name ?? "";
const tripLink = (path) => `#/${path}${trip ? `?${tripToQuery(trip)}` : ""}`;

// ---------- shared pieces ----------

// fill: the band stretches to cover its wrapper (home hero, trip header) instead
// of using the page's fixed --band-h height
function band(photo, { arcs = true, fill = false } = {}) {
  return `<div class="band${fill ? " fill" : ""}" aria-hidden="true">
    ${photo ? `<img class="photo" src="${photo}" alt="" />` : ""}
    <div class="overlay${photo ? "" : " plain"}"></div>
    ${arcs ? `<img class="arcs" src="${A}decor-band-arcs.svg" alt="" width="1564.5" height="1153" />` : ""}
  </div>`;
}

function sourceRows(sources) {
  // one row per official page; the row shows the organization only (design rule, Nov 5)
  const seen = new Set();
  return sources
    .filter((s) => s.url && !seen.has(s.url) && seen.add(s.url))
    .map((s) => `<li><a class="source" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">
        <span class="icon-circle"><img src="${A}source-landmark.svg" alt="" /></span>
        <span>${esc(s.organization)}</span>
        <img src="${A}icon-external.svg" alt="" /><span class="visually-hidden">(opens in a new tab)</span>
      </a></li>`)
    .join("");
}

function noTrip() {
  return `<section class="page plan">${band(PHOTO.plan)}
    <div class="container">
      <h1 class="page-title" tabindex="-1">No trip yet</h1>
      <div class="plan-row"><div class="card empty">
        <p>Tell us where you're going and we'll build your checklist and guides.</p>
        <a class="btn btn-primary btn-l" href="#/plan">Plan a trip <img src="${A}icon-arrow-right.svg" alt="" /></a>
      </div></div>
    </div></section>`;
}

// ---------- home ----------

function home() {
  return `<div class="page home">
    <div class="band-wrap">${band(null, { arcs: false, fill: true })}
    <div class="container">
      <section class="hero on-dark">
        <div>
          <h1 tabindex="-1">Let’s gear up!</h1>
          <p class="lead">Give us some basic details of your trip and we’ll create an easy to understand dashboard to assist in making sure you’re ready for anything.</p>
          <form class="login" id="login" novalidate>
            <h2>Log in</h2>
            <div class="fields">
              <div class="field"><label for="email">Email</label>
                <div class="input"><input id="email" type="email" autocomplete="email" placeholder="you@example.com" /></div></div>
              <div class="field"><label for="password">Password</label>
                <div class="input"><input id="password" type="password" autocomplete="current-password" placeholder="Enter your password" /></div></div>
            </div>
            <button class="btn btn-primary btn-l" type="submit">Log in <img src="${A}icon-arrow-right.svg" alt="" /></button>
            <p class="notice" id="login-note" role="status" hidden>Accounts aren’t switched on yet. Continue as a guest to plan your trip.</p>
            <p class="or">or</p>
            <div class="options">
              <a class="btn btn-secondary" href="#/plan">Sign up</a>
              <a class="btn btn-secondary" href="#/plan">Continue as guest</a>
            </div>
          </form>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="rings" id="rings"><img src="${A}decor-hero-rings.svg" alt="" width="600" height="600" /></div>
          <div class="badge"><img src="${A}logo-mark-hero.svg" alt="" /></div>
        </div>
      </section>
    </div></div>
    <div class="container">
      ${howItWorks()}
      ${trustSection()}
    </div>
  </div>`;
}

function howItWorks() {
  const steps = [
    ["Tell us about your trip", "Add where you’re going, your dates and the purpose of your travel."],
    ["Get your checklist and guide", "See what to do before you leave and what to know when you land."],
    ["Check the official source", "Every guide lists the official pages it’s based on, so you can confirm the details yourself."],
  ];
  return `<section class="section" aria-labelledby="how">
    <h2 class="h2" id="how">How RoamReady works</h2>
    <ol class="steps">${steps.map(([title, text], i) => `<li class="card">
      <span class="step-number" aria-hidden="true">${i + 1}</span>
      <h3 class="title-m">${title}</h3><p>${text}</p></li>`).join("")}</ol>
  </section>`;
}

function trustSection() {
  const tiles = [
    ["trust-landmark", "entry", "U.S. Department of State", "Entry rules, travel advisories and embassy contacts."],
    ["trust-globe", "money", "Destination governments", "Visa rules, customs and which medicines you can bring."],
    ["trust-plane", "there", "Airports and transit", "Getting from the airport and getting around the city."],
    ["trust-map", "safety", "Official tourism boards", "Money, phones, etiquette and local customs."],
  ];
  return `<section class="section" aria-labelledby="trust">
    <h2 class="h2" id="trust">Information you can trust</h2>
    <div class="trust">
      <ul class="trust-tiles">${tiles.map(([icon, tint, title, text]) => `<li class="card">
        <span class="icon-circle" style="background: var(--rr-guide-tint-${tint})"><img src="${A}${icon}.svg" alt="" /></span>
        <h3 class="title-m">${title}</h3><p class="small">${text}</p></li>`).join("")}</ul>
      <img class="trust-photo" src="${PHOTO.arrivals}" alt="" loading="lazy" />
    </div>
  </section>`;
}

// the hero rings are inlined so their strokes can draw on (the page's one motion moment)
async function animateRings() {
  const holder = document.querySelector("#rings");
  if (!holder) return;
  try {
    const svgText = await (await fetch(`${A}decor-hero-rings.svg`)).text();
    holder.innerHTML = svgText;
    const svg = holder.querySelector("svg");
    svg.setAttribute("width", "600");
    svg.setAttribute("height", "600");
    const group = svg.querySelector("g");
    group.classList.add("spin");
    svg.querySelectorAll("path, circle").forEach((shape, i) => {
      const delay = `${Math.min(i * 0.012, 0.45)}s`;
      if (shape.getAttribute("stroke") && shape.tagName === "path") {
        shape.style.setProperty("--len", Math.ceil(shape.getTotalLength()));
        shape.style.setProperty("--delay", delay);
        shape.classList.add("draw");
      } else {
        shape.style.setProperty("--delay", delay);
        shape.classList.add("pop");
      }
    });
  } catch {
    // the static <img> stays in place if the SVG can't be inlined
  }
}

function wireHome() {
  animateRings();
  const form = document.querySelector("#login");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const note = document.querySelector("#login-note");
    note.hidden = false;
  });
}

// ---------- plan a trip ----------

function plan() {
  const t = trip || {};
  const preview = STAGES.map((stage) => `<div class="stage">
      <span class="stage-pill ${stage.id}-stage">${stage.label}</span>
      <ul>${GUIDES.filter((g) => g.stage === stage.id).map((g) => `<li>
        <span class="swatch" style="background:${g.color}"><img src="${g.swatch}" alt="" /></span>${g.title}</li>`).join("")}</ul>
    </div>`).join("");

  return `<div class="page plan">${band(PHOTO.plan)}
    <div class="container">
      <h1 class="page-title" tabindex="-1">Let’s get prepared!</h1>
      <div class="plan-row">
        <form class="card plan-form" id="plan-form" novalidate>
          <div class="field" id="f-country">
            <label for="country">Where are you going?</label>
            <div class="input"><img src="${A}icon-search.svg" alt="" />
              <input id="country" list="countries" autocomplete="off" placeholder="Search a country" value="${esc(countryName(t.country))}" required /></div>
            <datalist id="countries">${destinations.map((d) => `<option value="${esc(d.name)}"></option>`).join("")}</datalist>
            <p class="error" id="country-error"><img src="${A}purpose-emergency.svg" alt="" />Pick one of the ${destinations.length} countries in the list.</p>
          </div>
          <fieldset class="field" id="f-dates">
            <legend>When are you traveling?</legend>
            <div class="dates">
              <label>Leaving<span class="input"><img src="${A}icon-calendar-field.svg" alt="" /><input id="from" type="date" value="${esc(t.from)}" /></span></label>
              <label>Coming back<span class="input"><img src="${A}icon-calendar-field.svg" alt="" /><input id="to" type="date" value="${esc(t.to)}" /></span></label>
            </div>
            <p class="error" id="dates-error"><img src="${A}purpose-emergency.svg" alt="" />Your return date is before you leave. Check both dates.</p>
          </fieldset>
          <fieldset class="field">
            <legend>What’s the trip for?</legend>
            <div class="purposes">${PURPOSES.map((p) => `<label class="purpose">
              <input type="radio" name="purpose" value="${p.id}" ${t.purpose === p.id ? "checked" : ""} />
              <span><img src="${p.icon}" alt="" />${p.label}</span></label>`).join("")}</div>
          </fieldset>
          <div class="field">
            <label for="trip-name">Give your trip a name (optional)</label>
            <div class="input"><input id="trip-name" maxlength="60" placeholder="For example: Spring break in Japan" value="${esc(t.name)}" /></div>
          </div>
          <div class="field">
            <label for="trip-description">Trip description (optional)</label>
            <textarea class="input-area" id="trip-description" maxlength="500" placeholder="For example: My first time abroad, mostly food, museums and a few day trips.">${esc(t.description)}</textarea>
          </div>
          <div><button class="btn btn-primary btn-l" type="submit">Create my plan <img src="${A}icon-arrow-right.svg" alt="" /></button></div>
        </form>
        <aside class="plan-preview" aria-labelledby="preview-title">
          <h2 class="h3" id="preview-title">Your plan will include</h2>
          ${preview}
        </aside>
      </div>
    </div></div>`;
}

function wirePlan() {
  const form = document.querySelector("#plan-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const typed = form.country.value.trim().toLowerCase();
    const match = destinations.find((d) => d.name.toLowerCase() === typed || d.slug === typed);
    const from = form.from.value;
    const to = form.to.value;
    const datesBad = from && to && to < from;

    // show each error and tie it to its field only while it applies
    const flag = (fieldId, input, errorId, bad) => {
      document.querySelector(fieldId).classList.toggle("invalid", bad);
      input.toggleAttribute("aria-invalid", bad);
      if (bad) input.setAttribute("aria-describedby", errorId);
      else input.removeAttribute("aria-describedby");
    };
    flag("#f-country", form.country, "country-error", !match);
    flag("#f-dates", form.to, "dates-error", Boolean(datesBad));
    if (!match) return form.country.focus();
    if (datesBad) return form.to.focus();

    rememberDescription(form["trip-description"].value.trim());
    trip = {
      country: match.slug,
      from,
      to,
      purpose: form.purpose.value || "",
      name: form["trip-name"].value.trim(),
    };
    done.clear();
    location.hash = tripLink("trip");
  });
}

// ---------- trip dashboard ----------

function checklistItems(country) {
  // the 8 tasks from the hi-fi (Nov 4), with the country swapped in
  return [
    "Check your passport is valid for your whole stay",
    `Check that your medicines are allowed in ${country}`,
    "Buy travel insurance that covers medical care",
    "Enroll in STEP so the U.S. Embassy can reach you",
    "Set up an eSIM or pocket Wi-Fi",
    "Tell your bank you’re traveling",
    `Check the entry rules for ${country}`,
    "Save your emergency numbers for offline use",
  ];
}

const CHECK = `<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 9.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

async function tripView() {
  if (!trip) return noTrip();
  const country = countryName(trip.country);
  const days = tripDays(trip);
  const purpose = purposeById(trip.purpose);
  const facts = await getFacts(trip.country, factQuery(trip));
  const groups = groupFacts(facts);
  const numbers = emergencyNumbers(facts);
  const embassy = facts.find((f) => f.category === "emergency")?.sources?.[0];

  const chips = [
    days ? [`${A}chip-calendar.svg`, `${formatRange(trip)} · ${days} ${days === 1 ? "day" : "days"}`] : null,
    purpose ? [`${A}chip-purpose.svg`, purpose.label] : null,
    [`${A}chip-passport.svg`, "U.S. passport rules"],
  ].filter(Boolean);

  const tiles = GUIDES.map((g) => `<li><a class="tile" href="${tripLink(`guide/${g.id}`)}">
      <span class="tile-band" style="background:${g.color}">
        <img class="whisk" src="${A}decor-whisk-rings.svg" alt="" /><img class="glyph" src="${g.icon}" alt="" />
      </span>
      <span class="tile-body">
        <span><span class="title-m">${g.title}</span>
        <span class="small blurb">${groups[g.id].length ? g.blurb : "No reviewed info for this country yet."}</span></span>
        <span class="arrow"><img src="${A}icon-arrow-small.svg" alt="" /></span>
      </span></a></li>`).join("");

  const tasks = checklistItems(country).map((label, i) => `<li>
      <button class="task" type="button" aria-pressed="${done.has(i)}" data-task="${i}">
        <span class="box">${CHECK}</span><span class="label">${esc(label)}</span>
      </button></li>`).join("");

  const contactRows = numbers.map((row) => `<li><a class="contact" href="tel:${esc(row.number.replace(/\s/g, ""))}">
      <span class="icon-circle"><img src="${A}icon-phone.svg" alt="" /></span>
      <span><span class="what">${esc(row.label)}</span><span class="number">${esc(row.number)}</span></span></a></li>`).join("");
  const embassyRow = embassy ? `<li><a class="contact" href="${esc(embassy.url)}" target="_blank" rel="noopener noreferrer">
      <span class="icon-circle"><img src="${A}icon-landmark.svg" alt="" /></span>
      <span><span class="what">U.S. Embassy</span><span class="number text">Contacts and help</span></span>
      <span class="visually-hidden">(opens in a new tab)</span></a></li>` : "";

  return `<div class="page trip">
    <div class="band-wrap">
      ${band(PHOTO.street, { fill: true })}
      <div class="container trip-band-content on-dark">
        <div class="trip-head">
          <div>
            <div class="trip-title">
              <h1 tabindex="-1">${esc(trip.name || `Your trip to ${country}`)}</h1>
              <a class="btn-icon-on-dark" href="${tripLink("plan")}" aria-label="Edit trip name"><img src="${A}icon-edit-on-dark.svg" alt="" width="20" height="20" /></a>
            </div>
            <ul class="chips">${chips.map(([icon, text]) => `<li><img src="${icon}" alt="" />${esc(text)}</li>`).join("")}</ul>
          </div>
          <a class="btn btn-light" href="${tripLink("plan")}"><img src="${A}icon-edit.svg" alt="" />Edit trip</a>
        </div>
        <ul class="tiles" aria-label="Your guides">${tiles}</ul>
      </div>
    </div>
    <div class="container plan-below">
      <section class="card checklist" aria-labelledby="before">
        <h2 class="h3" id="before">Before you leave</h2>
        <ul>${tasks}</ul>
      </section>
      <section class="card essentials" aria-labelledby="essentials">
        <h2 class="h3" id="essentials">Trip essentials</h2>
        ${contactRows || embassyRow ? `<ul>${contactRows}${embassyRow}</ul>`
          : `<p class="small fallback">No reviewed emergency numbers for ${esc(country)} yet. Check the Safety guide.</p>`}
      </section>
    </div>
  </div>`;
}

function wireTrip() {
  document.querySelectorAll("[data-task]").forEach((button) => {
    button.addEventListener("click", () => {
      const i = Number(button.dataset.task);
      done.has(i) ? done.delete(i) : done.add(i);
      button.setAttribute("aria-pressed", String(done.has(i)));
    });
  });
}

// ---------- guide ----------

let guideFacts = [];

function matchLabel(fact) {
  // conditional facts only show because of the trip's details, so say which ones
  if (fact.applicability_status !== "conditional") return "";
  const bits = [];
  if (fact.applies_to_purposes?.length) bits.push(`${purposeById(trip.purpose)?.label ?? "your"} trip`);
  if (fact.min_stay_days || fact.max_stay_days) bits.push(`${tripDays(trip)}-day stay`);
  return bits.length ? `<span class="match">Matches your ${bits.join(", ")}</span>` : "";
}

async function guideView(id) {
  const guide = guideById(id);
  if (!guide) return notFound();
  if (!trip) return noTrip();
  const country = countryName(trip.country);
  const facts = await getFacts(trip.country, factQuery(trip));
  guideFacts = groupFacts(facts)[guide.id];

  const nav = STAGES.map((stage) => `<li class="group">${stage.label}</li>${GUIDES.filter((g) => g.stage === stage.id).map((g) => `<li>
      <a class="side-link" href="${tripLink(`guide/${g.id}`)}" style="--dot:${g.color}" ${g.id === guide.id ? 'aria-current="page"' : ""}>
      <span class="dot" aria-hidden="true"></span>${g.title}</a></li>`).join("")}`).join("");

  // the whole card is clickable, but the real control is the Learn more button
  // (its ::after stretches over the card), so headings stay out of the button
  const cards = guideFacts.map((fact, i) => `<li><article class="topic">
      <div class="topic-tint" style="background:${guide.tint}" aria-hidden="true">
        <img class="whisk" src="${A}decor-whisk-rings.svg" alt="" /><img class="glyph" src="${guide.topicIcon}" alt="" />
      </div>
      <div class="topic-body">
        <div><h2>${esc(fact.title)}</h2><p class="small">${esc(fact.plain_summary)}</p>${matchLabel(fact)}</div>
        <button class="learn" type="button" data-fact="${i}" aria-haspopup="dialog">Learn more<span class="visually-hidden"> about ${esc(fact.title)}</span>
          <span class="arrow"><img src="${A}icon-arrow-small.svg" alt="" /></span></button>
      </div></article></li>`).join("");

  const sources = guideFacts.flatMap((fact) => fact.sources || []);

  return `<div class="page guide">${band(PHOTO.arrivals)}
    <div class="container">
      <div class="guide-head on-dark">
        <a class="back" href="${tripLink("trip")}"><img src="${A}icon-arrow-left-on-dark.svg" alt="" />Back to your trip</a>
        <div class="guide-title">
          <span class="icon-box"><img src="${guide.id === "entry" ? `${A}guide-entry.svg` : guide.icon}" alt="" /></span>
          <h1 tabindex="-1">${guide.title}</h1>
        </div>
      </div>
      <div class="guide-columns">
        <nav class="card sidebar" aria-label="Guides">
          <div class="trip-summary">
            <p><strong>${esc(country)}</strong><span class="small">${esc(formatRange(trip))}</span></p>
            <a class="btn btn-secondary" href="${tripLink("plan")}"><img src="${A}icon-edit.svg" alt="" />Edit trip</a>
          </div>
          <hr />
          <ul class="guide-nav">
            <li><a class="side-link" href="${tripLink("trip")}"><img src="${A}icon-home.svg" alt="" />Overview</a></li>
            ${nav}
          </ul>
        </nav>
        <div>
          ${cards ? `<ul class="topics">${cards}</ul>` : `<div class="card empty"><p>There’s no reviewed ${esc(guide.title.toLowerCase())} info for ${esc(country)} yet. The research team adds facts after checking them against official sources.</p>
            <a class="btn btn-secondary" href="${tripLink("trip")}">Back to your trip</a></div>`}
          ${sources.length ? `<section class="sources" aria-labelledby="sources-title">
            <h2 class="h3" id="sources-title">Sources for this page</h2>
            <ul class="card source-list">${sourceRows(sources)}</ul></section>` : ""}
        </div>
      </div>
    </div></div>`;
}

function wireGuide(id) {
  const guide = guideById(id);
  const dialog = document.querySelector("#learn-more");
  document.querySelectorAll("[data-fact]").forEach((button) => {
    button.addEventListener("click", () => {
      const fact = guideFacts[Number(button.dataset.fact)];
      dialog.innerHTML = `<div class="tint" style="background:${guide.color}"></div>
        <div class="inner">
          <div class="top"><h2 id="learn-more-title">${esc(fact.title)}</h2>
            <form method="dialog"><button class="close" type="submit" aria-label="Close">×</button></form></div>
          <p>${esc(fact.plain_summary)}</p>
          ${matchLabel(fact)}
          ${fact.official_text_excerpt ? `<blockquote><p class="small">From the official page</p><p>${esc(fact.official_text_excerpt)}</p></blockquote>` : ""}
          <h3>Sources for this topic</h3>
          <ul class="source-list">${sourceRows(fact.sources || [])}</ul>
        </div>`;
      dialog.showModal();
    });
  });
  // clicking the dimmed backdrop closes the dialog too
  dialog.onclick = (event) => { if (event.target === dialog) dialog.close(); };
}

// ---------- about ----------

function about() {
  return `<div class="page plan">${band(PHOTO.plan)}
    <div class="container">
      <h1 class="page-title" tabindex="-1">About RoamReady</h1>
      <div class="plan-row" style="grid-template-columns:1fr"><div class="card empty">
        <p>RoamReady gathers the official rules for your first solo trip abroad into one checklist and a set of plain-language guides. Every fact links to the government or official page it came from.</p>
        <p>It’s a CU Boulder Information Science senior capstone, built for travelers with a U.S. passport.</p>
      </div></div>
      ${howItWorks()}
      ${trustSection()}
    </div></div>`;
}

function notFound() {
  return `<div class="page plan">${band(PHOTO.plan)}<div class="container">
    <h1 class="page-title" tabindex="-1">Page not found</h1>
    <div class="plan-row" style="grid-template-columns:1fr"><div class="card empty"><p>That page doesn’t exist.</p>
    <a class="btn btn-primary btn-l" href="#/">Go home</a></div></div></div></div>`;
}

// ---------- router ----------

const ROUTES = {
  "": { nav: "home", title: "RoamReady", view: home, wire: wireHome },
  plan: { nav: "plan", title: "Plan a trip", view: plan, wire: wirePlan },
  trip: { nav: "trip", title: "My trip", view: tripView, wire: wireTrip },
  guide: { nav: "trip", title: "Guide", view: guideView, wire: wireGuide },
  about: { nav: "about", title: "About", view: about, wire: () => {} },
};

async function render() {
  const [path, query = ""] = location.hash.replace(/^#\/?/, "").split("?");
  const [name, param] = path.split("/");
  const route = ROUTES[name] ?? { nav: null, title: "Page not found", view: notFound, wire: () => {} };

  // the address bar holds the trip, so links and refreshes keep it
  const fromUrl = tripFromQuery(query);
  if (fromUrl) trip = fromUrl;

  if (!destinations.length) destinations = await getDestinations();
  if (trip && !countryName(trip.country)) trip = null;

  main.setAttribute("aria-busy", "true");
  main.innerHTML = await route.view(param);
  main.removeAttribute("aria-busy");
  route.wire(param);

  document.querySelectorAll(".nav a").forEach((link) => {
    if (link.dataset.route === route.nav) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    // keep the trip in the nav links too
    if (link.dataset.route === "trip" || link.dataset.route === "plan") link.href = tripLink(link.dataset.route);
  });
  const guideTitle = name === "guide" ? guideById(param)?.title : null;
  document.title = `${guideTitle || route.title} · RoamReady`.replace("RoamReady · RoamReady", "RoamReady");

  closeMenu();
  window.scrollTo(0, 0);
  // move focus to the new page's heading so screen readers announce it
  if (rendered) main.querySelector("h1")?.focus({ preventScroll: true });
  rendered = true;
}
let rendered = false;

// ---------- header menu, guest dialog, data-source note ----------

const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector("#nav");
function closeMenu() {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
}
menuButton.addEventListener("click", () => {
  const open = !nav.classList.contains("open");
  nav.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("[data-open-guest]").forEach((button) =>
  button.addEventListener("click", () => document.querySelector("#guest").showModal()));

onSourceChange(({ mode, newestCheck }) => {
  const note = document.querySelector("#data-source");
  if (mode === "live") note.textContent = "Guide data comes live from the RoamReady database.";
  if (mode === "snapshot") {
    const date = newestCheck ? new Date(`${newestCheck}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
    note.textContent = `Guide data is a saved copy${date ? ` from ${date}` : ""}.`;
  }
});

window.addEventListener("hashchange", render);
render().catch((error) => {
  main.innerHTML = `<div class="container"><div class="card empty" style="margin:48px 0"><h1 class="h3" tabindex="-1">The guides couldn’t load</h1>
    <p>${esc(error.message)} Refresh the page to try again.</p></div></div>`;
});
