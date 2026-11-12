// page shell: a small hash router and its views (home, plan, trip, guide, topic,
// about, sign up, saved trips). every piece of text from the database goes
// through esc() before it reaches the page.

import { getDestinations, getFacts, onSourceChange, retryLive } from "./api.js?v=20261110-original24";
import { GUIDES, STAGES, PURPOSES, guideById, groupFacts, emergencyNumbers, purposeById } from "./guides.js";
import { tripFromQuery, tripToQuery, rememberDescription, tripDays, formatRange, factQuery, DEMO_TRIP } from "./trip.js";
import { enter, wireDialogs, staggerMenu, shake } from "./motion.js";
import { loadJapanResearch } from "./japan-subcards.js";
import { loadCountryTopics } from "./country-topics.js?v=20261110-original24";
import { topicsForGuide } from "./topics.js?v=20261110-original24";
import { session, signIn, signUp, signOut } from "./auth.js";
import { listTrips, loadTrip, saveTrip, deleteTrip, fromRow, savedChecks } from "./saved-trips.js";

const main = document.querySelector("#main");
const A = "assets/figma/";

let user = null;               // the signed-in Supabase user, or null
let loadedTrip = null;         // "<user id>:<trip id>" of the saved trip in memory, so it loads once
let trip = DEMO_TRIP ? { ...DEMO_TRIP } : null;  // the current guest trip (the test trip when DEMO_TRIP is set), or null
let destinations = [];         // [{ slug, name, ... }] from the API or the snapshot
const done = new Set();        // checklist items ticked in this tab
let renderGeneration = 0;      // bumps on every render, so a slow page can't replace a newer one
let rendered = false;          // false until the first page is shown

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// only http(s) links from the data become hrefs, so a bad row can't sneak in a
// javascript: link. returns the normalized URL, or null
function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

const countryName = (slug) => destinations.find((d) => d.slug === slug)?.name ?? "";
const tripLink = (path) => `#/${path}${trip ? `?${tripToQuery(trip)}` : ""}`;

// ---------- shared pieces ----------

// RoamReady's own 3 photos, for pages that aren't about one country
const UNIVERSAL = {
  hero: "assets/photos/universal/hero.webp",     // Home and Sign up
  plan: "assets/photos/universal/plan.webp",     // Plan a trip, No trip yet, About, account pages
  arrive: "assets/photos/universal/arrive.webp", // the photo beside the sources on Home
};

// a country's photo lives in css/photos.css, not here: the page only says
// which country and which spot ("dashboard" or "guide"), and the stylesheet
// has the file for it
const countryPhoto = (slug, spot) => ({ country: slug, spot });

// fill: the band stretches to cover its wrapper (home hero, trip header) instead
// of using the page's fixed --band-h height. photo is a file path, or a
// countryPhoto() for a country's photo
function band(photo, { arcs = true, fill = false } = {}) {
  const picture = !photo ? ""
    : photo.country !== undefined
      ? `<div class="photo country-photo" data-country="${esc(photo.country)}" data-photo="${photo.spot}"></div>`
      : `<img class="photo" src="${photo}" alt="" />`;
  return `<div class="band${fill ? " fill" : ""}" aria-hidden="true">
    ${picture}
    <div class="overlay${photo ? "" : " plain"}"></div>
    ${arcs ? `<img class="arcs" src="${A}decor-band-arcs.svg" alt="" width="1564.5" height="1153" />` : ""}
  </div>`;
}

function noTrip() {
  return `<section class="page plan">${band(UNIVERSAL.plan)}
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
    <div class="band-wrap">${band(UNIVERSAL.hero, { arcs: false, fill: true })}
    <div class="container">
      <section class="hero on-dark">
        <div>
          <h1 tabindex="-1">Let’s gear up!</h1>
          <p class="lead">Give us some basic details of your trip and we’ll create an easy to understand dashboard to assist in making sure you’re ready for anything.</p>
          <form class="login" id="login">
            <h2>Log in</h2>
            <div class="fields">
              <div class="field"><label for="email">Email</label>
                <div class="input"><input id="email" required type="email" autocomplete="email" placeholder="you@example.com" /></div></div>
              <div class="field"><label for="password">Password</label>
                <div class="input"><input id="password" required type="password" autocomplete="current-password" placeholder="Enter your password" /></div></div>
            </div>
            <button class="btn btn-primary btn-l" type="submit">Log in <img src="${A}icon-arrow-right.svg" alt="" /></button>
            <p class="notice" id="login-note" role="status" hidden></p>
            <p class="or">or</p>
            <div class="options">
              <a class="btn btn-secondary" href="#/signup">Sign up</a>
              <a class="btn btn-secondary" href="#/plan">Continue as guest</a>
            </div>
          </form>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="badge" data-logo-build></div>
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
    ["Start with your trip", "Choose your destination, travel dates and reason for visiting to find guidance that fits your plans."],
    ["Explore your travel essentials", "Find clear guidance on entry documents, health, money, transport and staying connected—all organized by topic."],
    ["Turn guidance into a plan", "Use your checklist to track preparations, and follow source links to confirm requirements before you travel."],
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
    ["trust-landmark", "entry", "U.S. Department of State", "U.S. government travel advisories and embassy guidance explain safety concerns and support available abroad."],
    ["trust-globe", "money", "Destination authorities", "The agencies responsible for immigration, customs and health provide guidance on entering the country and what you can bring."],
    ["trust-plane", "there", "Airports & transport operators", "Information directly from airports, train services and bus operators helps you understand arrival options and local transport."],
    ["trust-map", "safety", "Official tourism organizations", "Official visitor resources offer practical advice on local customs, payments and staying connected."],
  ];
  return `<section class="section" aria-labelledby="trust">
    <h2 class="h2" id="trust">Know where your travel information comes from</h2>
    <p>Our guides bring together information from government agencies, transport operators and official tourism organizations. Source links and verification dates show where the guidance comes from and when it was last checked.</p>
    <div class="trust">
      <ul class="trust-tiles">${tiles.map(([icon, tint, title, text]) => `<li class="card">
        <span class="icon-circle" style="background: var(--rr-guide-tint-${tint})"><img src="${A}${icon}.svg" alt="" /></span>
        <h3 class="title-m">${title}</h3><p class="small">${text}</p></li>`).join("")}</ul>
      <img class="trust-photo" src="${UNIVERSAL.arrive}" alt="" loading="lazy" />
    </div>
  </section>`;
}

function wireHome() {
  const form = document.querySelector("#login");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const note = document.querySelector("#login-note");
    const button = form.querySelector("[type=submit]");
    note.hidden = false;
    note.textContent = "Logging in…";
    button.disabled = true;
    try {
      const data = await signIn(form.email.value.trim(), form.password.value);
      user = data.user;
      loadedTrip = null;
      form.reset();
      location.hash = "#/account";
    } catch (error) {
      note.textContent = error.message;
    } finally {
      button.disabled = false;
    }
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

  return `<div class="page plan">${band(UNIVERSAL.plan)}
    <div class="container">
      <h1 class="page-title" tabindex="-1">Let’s get prepared!</h1>
      <div class="plan-row">
        <form class="card plan-form" id="plan-form" novalidate>
          <div class="field" id="f-country">
            <label for="country">Where are you going?</label>
            <div class="combo">
              <div class="input"><img src="${A}icon-search.svg" alt="" />
                <input id="country" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="country-list" autocomplete="off" placeholder="Search or pick a country" value="${esc(countryName(t.country))}" required />
                <button class="combo-toggle" type="button" tabindex="-1" aria-label="Show all countries"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              </div>
              <ul class="combo-list" id="country-list" role="listbox" aria-label="Countries" hidden></ul>
            </div>
            <p class="error" id="country-error"><img src="${A}purpose-emergency.svg" alt="" />Pick one of the ${destinations.length} countries in the list.</p>
          </div>
          <fieldset class="field" id="f-dates">
            <legend>When are you traveling?</legend>
            <div class="dates">
              <label>Leaving<span class="input"><img src="${A}icon-calendar-field.svg" alt="" /><input id="from" type="date" value="${esc(t.from)}" /></span></label>
              <label>Coming back<span class="input"><img src="${A}icon-calendar-field.svg" alt="" /><input id="to" type="date" value="${esc(t.to)}" /></span></label>
            </div>
            <p class="error" id="dates-error"><img src="${A}purpose-emergency.svg" alt="" />Check both dates. Add a leaving date before a return date, and use a stay of no more than 100 years.</p>
          </fieldset>
          <fieldset class="field">
            <legend>What’s the trip for?</legend>
            <div class="purposes">${PURPOSES.map((p) => `<label class="purpose">
              <input type="radio" name="purpose" required value="${p.id}" ${t.purpose === p.id ? "checked" : ""} />
              <span><img src="${p.icon}" alt="" />${p.label}</span></label>`).join("")}</div>
          </fieldset>
          <div class="field">
            <label for="trip-name">Give your trip a name (optional)</label>
            <div class="input"><input id="trip-name" maxlength="60" placeholder="For example: Spring break in Japan" value="${esc(t.name)}" /></div>
          </div>
          <div class="field">
            <label for="trip-description">Trip description (optional)</label>
            <textarea class="input-area" id="trip-description" maxlength="500" placeholder="For example: My first time abroad, mostly food, museums and a few day trips.">${esc(t.description)}</textarea><p class="small">This optional description stays in this tab and is not saved to your account.</p>
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

// the country box: type to filter, or click it (or the arrow) to see every
// country. Arrow keys move through the list, Enter picks, Escape closes.
function wireCountryPicker(input) {
  const list = document.querySelector("#country-list");
  const toggle = input.parentElement.querySelector(".combo-toggle");
  const countries = [...destinations].sort((a, b) => a.name.localeCompare(b.name));
  let shown = [], active = -1;

  const isOpen = () => !list.hidden;
  const close = () => {
    list.hidden = true; active = -1;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  };
  const highlight = (i) => {
    active = i;
    list.querySelectorAll("[role=option]").forEach((li, n) => li.setAttribute("aria-selected", String(n === i)));
    const li = list.children[i];
    if (li) { input.setAttribute("aria-activedescendant", li.id); li.scrollIntoView({ block: "nearest" }); }
    else input.removeAttribute("aria-activedescendant");
  };
  const open = (showAll) => {
    const typed = input.value.trim().toLowerCase();
    shown = showAll || !typed ? countries : countries.filter((d) => d.name.toLowerCase().includes(typed));
    list.innerHTML = shown.length
      ? shown.map((d, i) => `<li role="option" id="country-opt-${i}" aria-selected="false">${esc(d.name)}</li>`).join("")
      : '<li class="combo-empty">No matching countries</li>';
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    // start on the country already in the box, if there is one
    highlight(shown.findIndex((d) => d.name.toLowerCase() === typed));
  };
  const pick = (i) => { input.value = shown[i].name; close(); };

  const exact = () => countries.some((d) => d.name.toLowerCase() === input.value.trim().toLowerCase());
  input.addEventListener("click", () => (isOpen() ? close() : open(exact())));
  input.addEventListener("input", () => open(false));
  input.addEventListener("blur", close);
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen()) return open(exact());
      if (!shown.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      highlight((active + step + shown.length) % shown.length);
    } else if (event.key === "Enter" && isOpen() && active >= 0) {
      event.preventDefault(); // pick the country instead of sending the form
      pick(active);
    } else if (event.key === "Escape" && isOpen()) {
      event.preventDefault(); close();
    }
  });
  toggle.addEventListener("mousedown", (event) => event.preventDefault()); // keep focus in the box
  toggle.addEventListener("click", () => { input.focus(); isOpen() ? close() : open(true); });
  list.addEventListener("mousedown", (event) => event.preventDefault());
  list.addEventListener("click", (event) => {
    const li = event.target.closest("[role=option]");
    if (li) pick([...list.children].indexOf(li));
  });
}

function wirePlan() {
  const form = document.querySelector("#plan-form");
  wireCountryPicker(form.country);
  // clicking anywhere in a date box opens the calendar, not just the small icon
  form.querySelectorAll('input[type="date"]').forEach((input) =>
    input.addEventListener("click", () => { try { input.showPicker(); } catch {} }));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const typed = form.country.value.trim().toLowerCase();
    const match = destinations.find((d) => d.name.toLowerCase() === typed || d.slug === typed);
    if (!form.purpose.value) return form.querySelector('[name="purpose"]').reportValidity();
    const from = form.from.value;
    const to = form.to.value;
    const datesBad = Boolean(to && (!from || to < from)) || (from && to && tripDays({from,to}) > 36500);

    // show each error and tie it to its field only while it applies
    const flag = (fieldId, input, errorId, bad) => {
      document.querySelector(fieldId).classList.toggle("invalid", bad);
      input.setAttribute("aria-invalid", String(bad));
      if (bad) input.setAttribute("aria-describedby", errorId);
      else input.removeAttribute("aria-describedby");
    };
    flag("#f-country", form.country, "country-error", !match);
    flag("#f-dates", form.to, "dates-error", Boolean(datesBad));
    if (!match) shake(form.country.closest(".input"));
    if (datesBad) shake(form.to.closest(".input"));
    if (!match) return form.country.focus();
    if (datesBad) return form.to.focus();

    // a new country starts a fresh checklist
    if (trip?.country !== match.slug) done.clear();
    rememberDescription(form["trip-description"].value.trim());
    trip = {
      id: trip?.id || "",
      country: match.slug,
      from,
      to,
      purpose: form.purpose.value,
      name: form["trip-name"].value.trim(),
    };
    loadedTrip = trip.id && user ? `${user.id}:${trip.id}` : null;
    location.hash = tripLink("trip");
  });
}

// ---------- trip dashboard ----------

// the same 8 tasks for every country (Aahana's comment #16). saved trips store
// them by index (task-0 … task-7, see saved-trips.js), so only add to the end
const CHECKLIST = [
  "Check your passport is valid for your whole stay",
  "Check that your medicines are allowed where you’re going",
  "Buy travel insurance that covers medical care",
  "Enroll in STEP so the U.S. Embassy can reach you",
  "Set up an eSIM or pocket Wi-Fi",
  "Tell your bank you’re traveling",
  "Check if you need a visa or an arrival form",
  "Save your emergency numbers for offline use",
];

const CHECK = `<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 9.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

async function tripView() {
  if (!trip) return noTrip();
  const country = countryName(trip.country);
  const days = tripDays(trip);
  const purpose = purposeById(trip.purpose);
  const facts = await getFacts(trip.country, factQuery(trip));
  const emergency = emergencyNumbers(facts);
  // the emergency fact's source is the State Department country page, which
  // lists the embassy's contacts; label the row by what the page is
  const consular = facts.find((f) => f.category === "emergency")?.sources?.find((s) => safeUrl(s.url));

  const chips = [
    days ? [`${A}chip-calendar.svg`, `${formatRange(trip)} · ${days} ${days === 1 ? "day" : "days"}`] : null,
    purpose ? [`${A}chip-purpose.svg`, purpose.label] : null,
    [`${A}chip-passport.svg`, "U.S. passport rules"],
  ].filter(Boolean);

  // each tile is a band in its stage color with the guide's icon on the rings
  // (back to the old icons, David, Nov 11; colors set by tile--<id> in
  // site.css) over one row: the title and the arrow.
  // a guide with no reviewed facts for this country says so under its title
  const groups = groupFacts(facts);
  const tiles = GUIDES.map((g) => `<li><a class="tile tile--${g.id}" href="${tripLink(`guide/${g.id}`)}">
      <span class="tile-band"><img class="whisk" src="${A}decor-whisk-rings.svg" alt="" /><span class="glyph tile-icon" style="-webkit-mask-image:url(${g.icon});mask-image:url(${g.icon})"></span></span>
      <span class="tile-body">
        <span class="tile-name"><span class="title-m">${g.title}</span>${groups[g.id].length ? "" : '<span class="small tile-empty">No info yet</span>'}</span>
        <span class="arrow"><img src="${A}icon-arrow-small.svg" alt="" /></span>
      </span></a></li>`).join("");

  const tasks = CHECKLIST.map((label, i) => `<li>
      <button class="task" type="button" aria-pressed="${done.has(i)}" data-task="${i}">
        <span class="box">${CHECK}</span><span class="label">${esc(label)}</span>
      </button></li>`).join("");

  // each number is its own tel: link, so "17 or 1548" can be tapped either way
  const contactRows = (emergency?.rows ?? []).map((row) => `<li class="contact">
      <span class="icon-circle"><img src="${A}${row.label.includes("Embassy") ? "icon-landmark" : "icon-phone"}.svg" alt="" /></span>
      <span><span class="what">${esc(row.label)}</span><span class="number">${row.numbers.map((n) =>
        `<a href="tel:${esc(n.replace(/-/g, ""))}">${esc(n)}</a>`).join(" or ")}</span></span></li>`).join("");
  const contactText = emergency?.text ? `<p class="emergency-text">${esc(emergency.text)}</p>` : "";
  const consularRow = consular ? `<li><a class="contact" href="${esc(safeUrl(consular.url))}" target="_blank" rel="noopener noreferrer">
      <span class="icon-circle"><img src="${A}icon-landmark.svg" alt="" /></span>
      <span><span class="what">U.S. consular help</span><span class="number text">${esc(consular.organization)}</span></span>
      <img class="ext" src="${A}icon-external.svg" alt="" /><span class="visually-hidden">(opens in a new tab)</span></a></li>` : "";

  return `<div class="page trip">
    <div class="band-wrap">
      ${band(countryPhoto(trip.country, "dashboard"), { arcs: false, fill: true })}
      <div class="container trip-band-content on-dark">
        <div class="trip-head">
          <div>
            <div class="trip-title">
              <h1 tabindex="-1">${esc(trip.name || `Your trip to ${country}`)}</h1>
              <button class="btn-icon-on-dark" id="rename-trip" type="button" aria-label="Rename trip"><img src="${A}icon-edit-on-dark.svg" alt="" width="20" height="20" /></button>
            </div>
            <ul class="chips">${chips.map(([icon, text]) => `<li><img src="${icon}" alt="" />${esc(text)}</li>`).join("")}</ul>
          </div>
          <div class="trip-actions">
            <a class="btn btn-light" href="${tripLink("plan")}"><img src="${A}icon-edit.svg" alt="" />Edit trip</a>
            ${user ? '<button class="btn btn-primary" id="save-trip">Save trip</button>' : '<a class="btn btn-primary" href="#/signup">Save trip</a>'}
            ${user ? '<p class="small save-status" id="save-status" role="status"></p>' : ""}
          </div>
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
        ${emergency ? `${contactText}<ul>${contactRows}${consularRow}</ul>`
          : `<p class="small fallback">No reviewed emergency numbers for ${esc(country)} yet. Check the <a href="${tripLink("guide/safety")}">Safety guide</a>.</p>`}
      </section>
    </div>
  </div>`;
}

// the pencil turns the title into a text box: Enter or leaving the box keeps
// the new name, Escape puts the old one back. Edit trip is for the details.
function wireRename() {
  const button = document.querySelector("#rename-trip");
  button?.addEventListener("click", () => {
    const h1 = document.querySelector(".trip-title h1");
    const input = document.createElement("input");
    input.className = "trip-name-input";
    input.maxLength = 60;
    input.value = trip.name || "";
    input.placeholder = h1.textContent;
    input.setAttribute("aria-label", "Trip name");
    const row = h1.parentElement;
    row.classList.add("editing");
    h1.after(input);
    input.focus(); input.select();

    let finished = false;
    const finish = (keep) => {
      if (finished) return;
      finished = true;
      const name = input.value.trim();
      if (keep && name !== (trip.name || "")) {
        const oldQuery = `?${tripToQuery(trip)}`;
        trip.name = name;
        const newQuery = `?${tripToQuery(trip)}`;
        // every link on the page carries the trip, so swap in the new name
        document.querySelectorAll('a[href^="#/"]').forEach((a) => {
          const href = a.getAttribute("href");
          if (href.endsWith(oldQuery)) a.setAttribute("href", href.slice(0, -oldQuery.length) + newQuery);
        });
        history.replaceState(null, "", tripLink("trip"));
        h1.textContent = name || `Your trip to ${countryName(trip.country)}`;
        const status = document.querySelector("#save-status");
        if (status) status.textContent = "Name changed. Save your trip to keep it.";
      }
      input.remove();
      row.classList.remove("editing");
      button.focus();
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); finish(true); }
      if (event.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
  });
}

function wireTrip() {
  wireRename();
  const status = document.querySelector("#save-status");  // only there when signed in
  document.querySelector("#save-trip")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    status.textContent = "Saving…";
    const generation = renderGeneration;
    try {
      const row = await saveTrip({ ...trip }, new Set(done));
      if (generation !== renderGeneration) return;  // the user already left this page
      trip.id = row.id;
      loadedTrip = `${user?.id}:${row.id}`;
      history.replaceState(null, "", tripLink("trip"));
      await render();
      const message = document.querySelector("#save-status");
      if (message) message.textContent = "Saved to your account.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  document.querySelectorAll("[data-task]").forEach((button) => {
    button.addEventListener("click", () => {
      const i = Number(button.dataset.task);
      done.has(i) ? done.delete(i) : done.add(i);
      button.setAttribute("aria-pressed", String(done.has(i)));
      if (status) status.textContent = "Checklist changed. Save your trip to keep this progress.";
    });
  });
}

// ---------- guide ----------

const loadTopicData = (country) => (country === "japan" ? loadJapanResearch() : loadCountryTopics());

// the card beside a guide or topic page: a back link, the trip, a button, then
// the list of links (hidden on one-column layouts)
function sidebar({ label, back, backText, button, links }) {
  return `<nav class="card sidebar" aria-label="${label}">
    <a class="back" href="${back}"><img src="${A}icon-arrow-left.svg" alt="" />${backText}</a>
    <div class="trip-summary">
      <p><strong>${esc(countryName(trip.country))}</strong><span class="small">${esc(formatRange(trip))}</span></p>
      ${button}
    </div>
    <hr />
    <ul class="guide-nav">${links}</ul>
  </nav>`;
}

const sideLink = (href, color, current, text) =>
  `<li><a class="side-link" href="${href}" style="--dot:${color}" ${current ? 'aria-current="page"' : ""}><span class="dot" aria-hidden="true"></span>${text}</a></li>`;

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
  pageTitle = guide.title;
  if (!trip) return noTrip();
  const country = countryName(trip.country);
  const facts = await getFacts(trip.country, factQuery(trip));
  const topics = topicsForGuide(trip.country, id, facts, await loadTopicData(trip.country));

  const links = STAGES.map((stage) => `<li class="group">${stage.label}</li>${GUIDES.filter((g) => g.stage === stage.id)
    .map((g) => sideLink(tripLink(`guide/${g.id}`), g.color, g.id === guide.id, g.title)).join("")}`).join("");
  const side = sidebar({
    label: "Guides",
    back: tripLink("trip"),
    backText: "Back to your trip",
    button: `<a class="btn btn-secondary" href="${tripLink("plan")}"><img src="${A}icon-edit.svg" alt="" />Edit trip</a>`,
    links,
  });

  // no Sources list here: each topic page shows its own sources next to the
  // facts they back (David, Nov 11)
  return `<div class="page guide">${band(countryPhoto(trip.country, "guide"))}
    <div class="container">
      <div class="guide-columns">
        ${side}
        <div class="guide-main">
          <div class="guide-head on-dark"><h1 tabindex="-1">${guide.title}</h1></div>
          ${topics.length ? `<ul class="topics">${topics.map((topic) => topicCard(guide, topic)).join("")}</ul>` : `<div class="card empty"><p>There’s no reviewed ${esc(guide.title.toLowerCase())} info for ${esc(country)} yet. The research team adds facts after checking them against official sources.</p>
            <a class="btn btn-secondary" href="${tripLink("trip")}">Back to your trip</a></div>`}
        </div>
      </div>
    </div></div>`;
}

// the whole card is clickable, but the real control is the Learn more link
// (its ::after stretches over the card), so headings stay out of the link.
// topicsForGuide() never returns an empty topic, so every card has a fact
function topicCard(guide, topic) {
  // lead with the fact the card is really about, where the first one isn't
  const lead = topic.id === "visas" ? topic.facts.find((f) => f.applicability_status === "conditional")
    : ["medicine", "medicines"].includes(topic.id) ? topic.facts.find((f) => /medicine/i.test(f.title))
    : null;
  const summary = (lead ?? topic.facts[0]).plain_summary;
  return `<li><article class="topic"><div class="topic-body">
    <div><h2>${esc(topic.title)}</h2><p class="small">${esc(summary)}</p><p class="small topic-status">Published supporting information</p></div>
    <a class="learn" href="${tripLink(`topic/${guide.id}/${topic.id}`)}">Learn more<span class="visually-hidden"> about ${esc(topic.title)}</span><span class="arrow"><img src="${A}icon-arrow-small.svg" alt="" /></span></a>
  </div></article></li>`;
}

// source rows: landmark, the page's name, and the open-in-new-tab icon
function sourceList(sources = []) {
  return `<ul class="source-list">${sources.map((source) => {
    const url = safeUrl(source.url);
    return url ? `<li><a class="source" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
        <span class="icon-circle"><img src="${A}source-landmark.svg" alt="" /></span>
        <span class="source-text">${esc(source.title?.trim() || source.organization || url)}</span>
        <img src="${A}icon-external.svg" alt="" /><span class="visually-hidden">(opens in a new tab)</span>
      </a></li>` : "";
  }).join("")}</ul>`;
}

// a draft research note that hasn't been published as a fact yet
function researchNote(note) {
  return `<section class="research-note">
    <h3>Research draft — awaiting publication review</h3>
    <p class="small">Researched ${esc(note.researched_at)}. This is not a published fact or a new verification today.</p>
    <p>${esc(note.text)}</p>
    ${note.shared_notes.map((shared) => `<p>${esc(shared.text)}</p><p class="small">Scope: ${esc(shared.scope)}</p>${sourceList(shared.sources)}`).join("")}
    ${note.limitations.length ? `<h4>Scope and remaining checks</h4><ul>${note.limitations.map((text) => `<li>${esc(text)}</li>`).join("")}</ul>` : ""}
    ${sourceList(note.sources)}
  </section>`;
}

async function topicPage(guideId, topicId) {
  const guide = guideById(guideId);
  if (!guide) return notFound();
  if (!trip) return noTrip();
  const facts = await getFacts(trip.country, factQuery(trip));
  const topics = topicsForGuide(trip.country, guideId, facts, await loadTopicData(trip.country));
  let topic = topics.find((t) => t.id === topicId);
  // links from before focused topics used a fact's id as the topic id; keep them working
  if (!topic) {
    const fact = facts.find((f) => f.id === topicId && guide.categories.includes(f.category));
    if (fact) topic = { id: fact.id, title: fact.title, facts: [fact], research: [] };
  }
  if (!topic) return notFound();
  pageTitle = topic.title;

  const side = sidebar({
    label: "Topic navigation",
    back: tripLink(`guide/${guideId}`),
    backText: `Back to ${esc(guide.title)}`,
    button: `<a class="btn btn-secondary" href="${tripLink("trip")}">Trip overview</a>`,
    links: `<li class="group">${esc(guide.title)}</li>${topics.map((t) =>
      sideLink(tripLink(`topic/${guideId}/${t.id}`), guide.color, t.id === topic.id, esc(t.title))).join("")}`,
  });
  const sections = topic.facts.map((f) => `<section class="detail-section">
      <h2>${esc(f.topic_title || f.title)}</h2>
      <p>${esc(f.plain_summary)}</p>
      <p class="detail-date">Last verified ${esc(f.last_verified_at)}</p>
      ${matchLabel(f)}
      ${f.official_text_excerpt ? `<blockquote>${esc(f.official_text_excerpt)}</blockquote>` : ""}
    </section>`).join("");

  return `<div class="page guide topic-detail">${band(countryPhoto(trip.country, "guide"))}
    <div class="container">
      <div class="guide-columns">
        ${side}
        <div class="guide-main">
          <div class="guide-head on-dark"><h1 tabindex="-1">${esc(topic.title)}</h1></div>
          <article class="card full-topic">
            ${sections || "<p>No published guidance is available for this topic and trip.</p>"}
            ${topic.research.map(researchNote).join("")}
            <section class="detail-sources"><h2>Sources</h2>${sourceList(topic.facts.flatMap((f) => f.sources || []))}</section>
          </article>
        </div>
      </div>
    </div></div>`;
}

// ---------- about ----------

function about() {
  // the band grows with the title + card (fill), so the sections below never
  // start on top of the photo, whatever the card's height at this width
  return `<div class="page plan about"><div class="band-wrap">${band(UNIVERSAL.plan, { fill: true })}
    <div class="container">
      <h1 class="page-title" tabindex="-1">About RoamReady</h1>
      <div class="plan-row" style="grid-template-columns:1fr"><div class="card empty">
        <p>RoamReady gathers the official rules for your first solo trip abroad into one checklist and a set of plain-language guides. Every fact links to the government or official page it came from.</p>
        <p>It’s a CU Boulder Information Science senior capstone, built for travelers with a U.S. passport.</p>
      </div></div>
    </div></div>
    <div class="container">
      ${howItWorks()}
      ${trustSection()}
    </div></div>`;
}

function notFound() {
  return `<div class="page plan">${band(UNIVERSAL.plan)}<div class="container">
    <h1 class="page-title" tabindex="-1">Page not found</h1>
    <div class="plan-row" style="grid-template-columns:1fr"><div class="card empty"><p>That page doesn’t exist.</p>
    <a class="btn btn-primary btn-l" href="#/">Go home</a></div></div></div></div>`;
}

// ---------- accounts ----------

function signupView() {
  return `<div class="page plan">${band(UNIVERSAL.plan)}<div class="container"><h1 class="page-title" tabindex="-1">Create your account</h1>
    <form class="card plan-form account-form" id="signup-form">
      <label for="signup-email">Email</label><div class="input"><input id="signup-email" type="email" autocomplete="email" required /></div>
      <label for="signup-password">Password</label><div class="input"><input id="signup-password" type="password" autocomplete="new-password" minlength="8" required /></div>
      <p class="small">Use at least 8 characters.</p>
      <button class="btn btn-primary" type="submit">Create account</button><p role="status" id="signup-status"></p><a href="#/">Back to log in</a>
    </form></div></div>`;
}

function wireSignup() {
  const form = document.querySelector("#signup-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const status = document.querySelector("#signup-status");
    button.disabled = true;
    status.textContent = "Creating your account…";
    try {
      const data = await signUp(form["signup-email"].value.trim(), form["signup-password"].value);
      form.reset();
      if (data.session) {
        user = data.user;
        location.hash = "#/account";
      } else {
        status.textContent = "Check your email to confirm your account, then return here to log in.";
      }
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

const loginCard = (title, extra = "") =>
  `<div class="container account-form card"><h1 tabindex="-1">${title}</h1><a class="btn btn-primary" href="#/">Log in</a>${extra}</div>`;

async function accountView() {
  user = (await session())?.user || null;
  if (!user) return loginCard("Log in to see saved trips", '<a class="btn btn-secondary" href="#/signup">Create an account</a>');
  const rows = await listTrips();
  const cards = rows.map((row) => `<li class="card">
      <h2 class="h3">${esc(row.trip_name || countryName(row.destination_slug))}</h2>
      <p>${esc(countryName(row.destination_slug))} · ${esc(formatRange(fromRow(row)))}</p>
      <a class="btn btn-primary" href="#/trip?${esc(tripToQuery(fromRow(row)))}">Open trip</a>
      <button class="btn btn-secondary" data-delete="${esc(row.id)}">Delete trip</button>
    </li>`).join("");
  return `<div class="page plan">${band(UNIVERSAL.plan)}<div class="container"><h1 class="page-title" tabindex="-1">Your saved trips</h1>
    <div class="card account-form">
      <p>Signed in as ${esc(user.email)}</p><p class="small">This browser keeps you signed in until you log out.</p>
      <button class="btn btn-secondary" id="logout">Log out</button><p id="account-status" role="status"></p>
    </div>
    <ul class="saved-trips">${cards}</ul>
    ${rows.length ? "" : "<p>No saved trips yet. Plan a trip, then choose Save trip on its dashboard.</p>"}
    <a class="btn btn-secondary" id="new-trip" href="#/plan">Plan a new trip</a></div></div>`;
}

// forget the trip in this tab (logging out, or starting a new plan)
function clearTrip() {
  trip = null;
  loadedTrip = null;
  done.clear();
  rememberDescription("");
}

function wireAccount() {
  document.querySelector("#logout")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await signOut();
      user = null;
      clearTrip();
      location.hash = "#/";
    } catch (error) {
      document.querySelector("#account-status").textContent = error.message;
      button.disabled = false;
    }
  });
  document.querySelector("#new-trip")?.addEventListener("click", clearTrip);
  // the confirm dialog's content is in index.html; each Delete trip button
  // points its confirm button at that trip
  const dialog = document.querySelector("#confirm");
  const confirm = dialog.querySelector("#confirm-delete");
  const status = dialog.querySelector("#delete-status");
  for (const button of document.querySelectorAll("[data-delete]")) {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      status.textContent = "";
      confirm.disabled = false;
      confirm.onclick = async () => {
        confirm.disabled = true;
        try {
          await deleteTrip(id);
          if (trip?.id === id) {
            trip = null;
            done.clear();
            loadedTrip = null;
          }
          dialog.close();
          await render();
        } catch (error) {
          status.textContent = error.message;
          confirm.disabled = false;
        }
      };
      dialog.showModal();
    });
  }
}

// ---------- router ----------

// wire runs once the page is on screen, for views that have controls
const ROUTES = {
  "": { nav: "home", title: "RoamReady", view: home, wire: wireHome },
  plan: { nav: "plan", title: "Plan a trip", view: plan, wire: wirePlan },
  trip: { nav: "trip", title: "My trip", view: tripView, wire: wireTrip },
  guide: { nav: "trip", title: "Guide", view: guideView },
  topic: { nav: "trip", title: "Topic detail", view: topicPage },
  about: { nav: "about", title: "About", view: about },
  signup: { nav: null, title: "Create account", view: signupView, wire: wireSignup },
  account: { nav: null, title: "Saved trips", view: accountView, wire: wireAccount },
};
const NOT_FOUND = { nav: null, title: "Page not found", view: notFound };

let pageTitle = null;  // a view can set a more specific title (a guide's or topic's name)

async function render() {
  const generation = ++renderGeneration;
  main.setAttribute("aria-busy", "true");
  main.innerHTML = '<div class="container account-form" role="status">Loading…</div>';
  const hash = location.hash.startsWith("#/") ? location.hash : "#/";
  const [path, query = ""] = hash.replace(/^#\/?/, "").split("?");
  const [name, param, rawTopic] = path.split("/");
  let topic = null;
  try { if (rawTopic) topic = decodeURIComponent(rawTopic); } catch {}
  const route = ROUTES[name] ?? NOT_FOUND;

  // the address bar holds the trip, so links and refreshes keep it
  const fromUrl = tripFromQuery(query);
  if (fromUrl) trip = fromUrl;
  // a saved trip's id in the URL grants nothing: it always loads through the
  // signed-in user's account
  if (fromUrl?.id && ["trip", "guide", "topic"].includes(name)) {
    user = (await session())?.user || null;
    if (!user) {
      trip = null;
      main.removeAttribute("aria-busy");
      main.innerHTML = loginCard("Log in to open this saved trip");
      return;
    }
    const identity = `${user.id}:${fromUrl.id}`;
    if (loadedTrip !== identity) {
      const row = await loadTrip(fromUrl.id);
      if (generation !== renderGeneration) return;
      trip = fromRow(row);
      done.clear();
      savedChecks(row).forEach((i) => done.add(i));
      loadedTrip = identity;
    }
  }

  if (!destinations.length) destinations = await getDestinations();
  if (trip && !countryName(trip.country)) trip = null;

  pageTitle = null;
  const html = await route.view(param, topic);
  if (generation !== renderGeneration) return;
  main.innerHTML = html;
  main.removeAttribute("aria-busy");
  route.wire?.();

  document.querySelectorAll(".nav a").forEach((link) => {
    if (link.dataset.route === route.nav) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    // keep the trip in the nav links too
    if (link.dataset.route === "trip" || link.dataset.route === "plan") link.href = tripLink(link.dataset.route);
  });
  const title = pageTitle || route.title;
  document.title = title === "RoamReady" ? title : `${title} · RoamReady`;

  closeMenu();
  window.scrollTo(0, 0);
  // the bouncy entrance for whatever just arrived (js/motion.js)
  enter(main);
  // move focus to the new page's heading so screen readers announce it
  if (rendered) main.querySelector("h1")?.focus({ preventScroll: true });
  rendered = true;
}

// ---------- header menu, dialogs, data-source note ----------

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

wireDialogs(document.querySelectorAll("dialog"));
staggerMenu(nav);

onSourceChange(({ mode, newestCheck }) => {
  const note = document.querySelector("#data-source");
  if (mode === "live") note.textContent = "Published facts come live from RoamReady.";
  if (mode === "snapshot") {
    const date = newestCheck ? new Date(`${newestCheck}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
    note.textContent = `Guide data is a saved copy${date ? ` from ${date}` : ""}.`;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Retry live guide";
    retry.onclick = () => {
      retryLive();
      destinations = [];
      render().catch(showLoadError);
    };
    note.append(" ", retry);
  }
});

// the skip link points at #main, which isn't a route: move focus there instead
// of letting the router treat it as an unknown page
document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  main.focus();
});

function showLoadError(error) {
  main.removeAttribute("aria-busy");
  main.innerHTML = `<div class="container"><div class="card empty" style="margin:48px 0"><h1 class="h3" tabindex="-1">The guides couldn’t load</h1>
    <p>${esc(error.message)}</p><button class="btn btn-primary" id="retry-page">Try again</button><a class="btn btn-secondary" href="#/">Go home</a></div></div>`;
  document.querySelector("#retry-page").onclick = () => render().catch(showLoadError);
}

// only "#/..." addresses are routes; anything else (an in-page anchor) is left alone
window.addEventListener("hashchange", () => {
  if (location.hash === "" || location.hash.startsWith("#/")) render().catch(showLoadError);
});

// signing in is optional: if the auth service can't be reached, the site still works as a guest
session().then((current) => { user = current?.user || null; }, () => {})
  .then(render).catch(showLoadError);
