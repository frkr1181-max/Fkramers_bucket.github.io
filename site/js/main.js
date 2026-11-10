// page shell: a small hash router and the five views (home, plan, trip, guide, about).
// every piece of text from the database goes through esc() before it reaches the page.

import { getDestinations, getFacts, onSourceChange, retryLive } from "./api.js?v=20261110-pages";
import { GUIDES, STAGES, PURPOSES, guideById, groupFacts, emergencyNumbers, purposeById } from "./guides.js";
import { tripFromQuery, tripToQuery, rememberDescription, tripDays, formatRange, factQuery } from "./trip.js";

import { loadJapanResearch } from "./japan-subcards.js";
import { loadCountryTopics } from "./country-topics.js";
import { topicsForGuide } from "./topics.js";
import { session, signIn, signUp, signOut } from "./auth.js";
import { listTrips, loadTrip, saveTrip, deleteTrip, fromRow, savedChecks } from "./saved-trips.js";

const main = document.querySelector("#main");
const A = "assets/figma/";
const PHOTO = { street: "assets/photos/street.webp", plan: "assets/photos/plan-street.webp", arrivals: "assets/photos/arrivals.webp" };

let user = null;
let loadedTrip = null;
let trip = null;               // the current guest trip, or null
let destinations = [];         // [{ slug, name, ... }] from the API or the snapshot
const done = new Set();        // checklist items ticked in this tab

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
    .map((s) => ({ ...s, url: safeUrl(s.url) }))
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
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const note=document.querySelector('#login-note'),button=form.querySelector('[type=submit]');
    note.hidden=false;note.textContent='Logging in…';button.disabled=true;
    try {const data=await signIn(form.querySelector('#email').value.trim(),form.querySelector('#password').value);user=data.user;loadedTrip=null;form.reset();location.hash='#/account';}
    catch(error){note.textContent=error.message;}
    finally{button.disabled=false;}
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

function wirePlan() {
  const form = document.querySelector("#plan-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const typed = form.country.value.trim().toLowerCase();
    const match = destinations.find((d) => d.name.toLowerCase() === typed || d.slug === typed);
    if(!form.purpose.value){form.querySelector('[name="purpose"]').reportValidity();return;}
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
    if (!match) return form.country.focus();
    if (datesBad) return form.to.focus();

    const previousTrip=trip;
    rememberDescription(form["trip-description"].value.trim());
    trip = {
      id: trip?.id || "",
      country: match.slug,
      from,
      to,
      purpose: form.purpose.value || "",
      name: form["trip-name"].value.trim(),
    };
    if(previousTrip?.country!==trip.country)done.clear();
    loadedTrip=trip.id && user ? `${user.id}:${trip.id}` : null;
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
  const emergency = emergencyNumbers(facts);
  // the emergency fact's source is the State Department country page, which
  // lists the embassy's contacts; label the row by what the page is
  const consular = facts.find((f) => f.category === "emergency")?.sources?.find((s) => safeUrl(s.url));

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
    <div class="container account-actions">
      ${user?'<button class="btn btn-primary" id="save-trip">Save trip</button><a class="btn btn-secondary" href="#/account">Saved trips</a>':'<a class="btn btn-primary" href="#/">Log in to save this trip</a>'}
      <p class="small" id="save-status" role="status">${trip.id?'Saved trip opened. Save any changes before leaving.':'Guest plans stay in the address bar. Save to an account to keep checklist progress.'}</p>
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

function wireTrip() {
  document.querySelector('#save-trip')?.addEventListener('click', async event=>{
    const button=event.currentTarget,status=document.querySelector('#save-status');button.disabled=true;status.textContent='Saving…';
    const selected={...trip},checks=new Set(done),generation=renderGeneration;
    try {
      const row=await saveTrip(selected,checks);
      if(generation!==renderGeneration)return;
      trip.id=row.id;loadedTrip=`${user?.id}:${row.id}`;history.replaceState(null,'',tripLink('trip'));
      await render();
      const message=document.querySelector('#save-status');if(message)message.textContent='Saved to your account.';
    } catch(error){status.textContent=error.message;}
    finally{button.disabled=false;}
  });
  document.querySelectorAll("[data-task]").forEach((button) => {
    button.addEventListener("click", () => {
      const i = Number(button.dataset.task);
      done.has(i) ? done.delete(i) : done.add(i);
      button.setAttribute("aria-pressed", String(done.has(i)));
      const status=document.querySelector("#save-status");if(status)status.textContent="Checklist changed. Save your trip to keep this progress.";
    });
  });
}

// ---------- guide ----------

let guideFacts = [];
let guideTopics = [];

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
  guideTopics = topicsForGuide(trip.country,id,facts,await loadTopicData(trip.country));

  const nav = STAGES.map((stage) => `<li class="group">${stage.label}</li>${GUIDES.filter((g) => g.stage === stage.id).map((g) => `<li>
      <a class="side-link" href="${tripLink(`guide/${g.id}`)}" style="--dot:${g.color}" ${g.id === guide.id ? 'aria-current="page"' : ""}>
      <span class="dot" aria-hidden="true"></span>${g.title}</a></li>`).join("")}`).join("");

  // the whole card is clickable, but the real control is the Learn more button
  // (its ::after stretches over the card), so headings stay out of the button
  const cards = renderTopicCards(guide,guideTopics);
  const sources = guideTopics.flatMap(sub=>sub.facts).flatMap(fact=>fact.sources||[]);

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

function researchCitations(sources){
 return `<ul class="source-list">${(sources||[]).map(source=>{const url=safeUrl(source.url);return url?`<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.title?.trim()||source.organization||url)}</a>${source.checked_at?` · Source checked ${esc(source.checked_at)}`:''}</li>`:'';}).join('')}</ul>`;
}
function renderResearch(note){
 return `<section class="research-note"><h3>Research draft — awaiting publication review</h3><p class="small">Researched ${esc(note.researched_at)}. This is not a published fact or a new verification today.</p><p>${esc(note.text)}</p>
 ${note.shared_notes.map(shared=>`<p>${esc(shared.text)}</p><p class="small">Scope: ${esc(shared.scope)}</p>${researchCitations(shared.sources)}`).join('')}
 ${note.limitations.length?`<h4>Scope and remaining checks</h4><ul>${note.limitations.map(text=>`<li>${esc(text)}</li>`).join('')}</ul>`:''}${researchCitations(note.sources)}</section>`;
}
function renderTopicCards(guide,subcards){
 return subcards.map((sub,i)=>{
 const status=sub.facts.length?'Published supporting information':'No published detail for this trip';
 const primary=sub.id==='visas'?sub.facts.find(f=>f.applicability_status==='conditional'):['medicine','medicines'].includes(sub.id)?sub.facts.find(f=>/medicine/i.test(f.title)):null;
 const summary=primary?.plain_summary||sub.facts[0]?.plain_summary||'No published information is available for this topic and trip yet.';
 return `<li><article class="topic"><div class="topic-tint" style="background:${guide.tint}" aria-hidden="true"><img class="whisk" src="${A}decor-whisk-rings.svg" alt=""/><img class="glyph" src="${guide.topicIcon}" alt=""/></div><div class="topic-body"><div><h2>${esc(sub.title)}</h2><p class="small">${esc(summary)}</p><p class="small topic-status">${status}</p></div><a class="learn" href="${tripLink(`topic/${guide.id}/${sub.id}`)}">Learn more<span class="visually-hidden"> about ${esc(sub.title)}</span><span class="arrow"><img src="${A}icon-arrow-small.svg" alt=""/></span></a></div></article></li>`;
 }).join('');
}
function wireGuide() {}

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

// ---------- accounts ----------
function signupView(){
 return `<div class="page plan">${band(PHOTO.plan)}<div class="container"><h1 class="page-title" tabindex="-1">Create your account</h1>
 <form class="card plan-form account-form" id="signup-form">
 <label for="signup-email">Email</label><div class="input"><input id="signup-email" type="email" autocomplete="email" required /></div>
 <label for="signup-password">Password</label><div class="input"><input id="signup-password" type="password" autocomplete="new-password" minlength="8" required /></div>
 <p class="small">Use at least 8 characters. Your session stays signed in on this browser until you log out.</p>
 <button class="btn btn-primary" type="submit">Create account</button><p role="status" id="signup-status"></p><a href="#/">Back to log in</a></form></div></div>`;
}
function wireSignup(){
 const form=document.querySelector('#signup-form');form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button'),status=document.querySelector('#signup-status');button.disabled=true;status.textContent='Creating your account…';
  try{const data=await signUp(form.querySelector('#signup-email').value.trim(),form.querySelector('#signup-password').value);form.reset();if(data.session){user=data.user;location.hash='#/account';}else status.textContent='Check your email to confirm your account, then return here to log in.';}
  catch(error){status.textContent=error.message;}finally{button.disabled=false;}
 });
}
async function accountView(){
 const current=await session();user=current?.user||null;
 if(!user)return `<div class="container account-form card"><h1 tabindex="-1">Log in to see saved trips</h1><a class="btn btn-primary" href="#/">Log in</a><a class="btn btn-secondary" href="#/signup">Create an account</a></div>`;
 const rows=await listTrips();
 return `<div class="page plan">${band(PHOTO.plan)}<div class="container"><h1 class="page-title" tabindex="-1">Your saved trips</h1>
 <div class="card account-form"><p>Signed in as ${esc(user.email)}</p><p class="small">This browser keeps you signed in until you log out.</p><button class="btn btn-secondary" id="logout">Log out</button><p id="account-status" role="status"></p></div>
 <ul class="saved-trips">${rows.map(row=>`<li class="card"><h2 class="h3">${esc(row.trip_name||countryName(row.destination_slug))}</h2><p>${esc(countryName(row.destination_slug))} · ${esc(formatRange(fromRow(row)))}</p><a class="btn btn-primary" href="#/trip?${esc(tripToQuery(fromRow(row)))}">Open trip</a><button class="btn btn-secondary" data-delete="${esc(row.id)}">Delete trip</button></li>`).join('')}</ul>
 ${rows.length?'':'<p>No saved trips yet. Plan a trip, then choose Save trip on its dashboard.</p>'}<a class="btn btn-secondary" id="new-trip" href="#/plan">Plan a new trip</a></div></div>`;
}
function wireAccount(){
 document.querySelector('#logout')?.addEventListener('click',async event=>{
  const status=document.querySelector('#account-status');event.currentTarget.disabled=true;
  try{await signOut();user=null;trip=null;loadedTrip=null;done.clear();rememberDescription('');location.hash='#/';}catch(error){status.textContent=error.message;event.currentTarget.disabled=false;}
 });
 document.querySelector('#new-trip')?.addEventListener('click',()=>{trip=null;loadedTrip=null;done.clear();rememberDescription('');});
 for(const button of document.querySelectorAll('[data-delete]'))button.addEventListener('click',()=>{
  const dialog=document.querySelector('#learn-more');dialog.innerHTML=`<div class="inner"><h2 id="learn-more-title">Delete this saved trip?</h2><p>This removes the trip and its saved checklist from your account.</p><button class="btn btn-primary" id="confirm-delete">Delete trip</button><form method="dialog"><button class="btn btn-secondary">Cancel</button></form><p id="delete-status" role="status"></p></div>`;dialog.showModal();
  dialog.querySelector('#confirm-delete').onclick=async event=>{event.currentTarget.disabled=true;try{await deleteTrip(button.dataset.delete);if(trip?.id===button.dataset.delete){trip=null;done.clear();loadedTrip=null;}dialog.close();await render();}catch(error){dialog.querySelector('#delete-status').textContent=error.message;event.currentTarget.disabled=false;}};
 });
}

// ---------- router ----------

async function loadTopicData(country){return country==='japan'?loadJapanResearch():loadCountryTopics();}
let renderedTopicTitle=null;
async function topicPage(guideId,topicId){
 const guide=guideById(guideId);if(!guide)return notFound();if(!trip)return noTrip();
 const country=countryName(trip.country);
 const facts=await getFacts(trip.country,factQuery(trip));
 const subs=topicsForGuide(trip.country,guideId,facts,await loadTopicData(trip.country));
 // Preserve existing links that used a fact UUID before focused country topics.
 let selected=subs.find(sub=>sub.id===topicId);
 if(!selected){const legacy=facts.find(f=>f.id===topicId&&guide.categories.includes(f.category));if(legacy)selected={id:legacy.id,title:legacy.title,facts:[legacy],research:[]};}
 if(!selected)return notFound();
 renderedTopicTitle=selected.title;
 const index=subs.indexOf(selected),previous=subs[index-1],next=subs[index+1];
 const sources=selected.facts.flatMap(f=>f.sources||[]);
 return `<div class="page guide topic-detail">${band(PHOTO.arrivals)}<div class="container">
 <div class="guide-head on-dark"><a class="back" href="${tripLink(`guide/${guideId}`)}"><img src="${A}icon-arrow-left-on-dark.svg" alt=""/>Back to ${esc(guide.title)}</a><div class="guide-title"><span class="icon-box"><img src="${guide.topicIcon}" alt=""/></span><div><p class="detail-eyebrow">${esc(country)} / ${esc(guide.title)}</p><h1 tabindex="-1">${esc(selected.title)}</h1></div></div></div>
 <div class="guide-columns"><nav class="card sidebar" aria-label="Topic navigation"><div class="trip-summary"><p><strong>${esc(country)}</strong><span class="small">${esc(formatRange(trip))}</span></p><a class="btn btn-secondary" href="${tripLink('trip')}">Trip overview</a></div><hr/><ul class="guide-nav"><li class="group">${esc(guide.title)}</li>${subs.map(sub=>`<li><a class="side-link" href="${tripLink(`topic/${guideId}/${sub.id}`)}" ${sub.id===selected.id?'aria-current="page"':''}><span class="dot" style="background:${guide.color}"></span>${esc(sub.title)}</a></li>`).join('')}<li><a class="side-link" href="${tripLink(`guide/${guideId}`)}">View all ${esc(guide.title.toLowerCase())} topics</a></li></ul></nav>
 <article class="card full-topic"><p class="detail-eyebrow">Your guide for ${esc(country)} · ${esc(purposeById(trip.purpose)?.label||'Trip preparation')}</p>
 ${selected.facts.length?selected.facts.map(f=>`<section class="detail-section"><h2>${esc(f.topic_title||f.title)}</h2><p>${esc(f.plain_summary)}</p><p class="detail-date">Last verified ${esc(f.last_verified_at)}</p>${matchLabel(f)}${f.official_text_excerpt?`<blockquote>${esc(f.official_text_excerpt)}</blockquote>`:''}</section>`).join(''):'<p>No published guidance is available for this topic and trip.</p>'}
 ${selected.research.map(renderResearch).join('')}
 <section class="detail-sources"><h2>Sources</h2>${researchCitations(sources)}</section>
 <nav class="detail-pagination" aria-label="Other topics">${previous?`<a class="btn btn-secondary" href="${tripLink(`topic/${guideId}/${previous.id}`)}">← ${esc(previous.title)}</a>`:'<span></span>'}${next?`<a class="btn btn-primary" href="${tripLink(`topic/${guideId}/${next.id}`)}">${esc(next.title)} →</a>`:`<a class="btn btn-primary" href="${tripLink(`guide/${guideId}`)}">Back to ${esc(guide.title)}</a>`}</nav>
 </article></div></div></div>`;
}

const ROUTES = {
 topic:{nav:"trip",title:"Topic detail",view:topicPage,wire:()=>{}},
  signup: {nav:null,title:"Create account",view:signupView,wire:wireSignup},
  account: {nav:null,title:"Saved trips",view:accountView,wire:wireAccount},
  "": { nav: "home", title: "RoamReady", view: home, wire: wireHome },
  plan: { nav: "plan", title: "Plan a trip", view: plan, wire: wirePlan },
  trip: { nav: "trip", title: "My trip", view: tripView, wire: wireTrip },
  guide: { nav: "trip", title: "Guide", view: guideView, wire: wireGuide },
  about: { nav: "about", title: "About", view: about, wire: () => {} },
};

let renderGeneration=0;
async function render() {
  const generation=++renderGeneration;
  main.setAttribute("aria-busy","true");
  main.innerHTML='<div class="container account-form" role="status">Loading…</div>';
  const hash = location.hash.startsWith("#/") ? location.hash : "#/";
  const [path, query = ""] = hash.replace(/^#\/?/, "").split("?");
  const [name, param, rawTopic] = path.split("/");
  let topic;try{topic=rawTopic?decodeURIComponent(rawTopic):null;}catch{topic=null;}
  const route = ROUTES[name] ?? { nav: null, title: "Page not found", view: notFound, wire: () => {} };

  // the address bar holds the trip, so links and refreshes keep it
  const fromUrl = tripFromQuery(query);
  if (fromUrl) trip = fromUrl;
  if(fromUrl?.id && ['trip','guide','topic'].includes(name)){
    const current=await session();user=current?.user||null;
    if(!user){trip=null;main.removeAttribute('aria-busy');main.innerHTML='<div class="container account-form card"><h1>Log in to open this saved trip</h1><a class="btn btn-primary" href="#/">Log in</a></div>';return;}
    const identity=`${user.id}:${fromUrl.id}`;
    if(loadedTrip!==identity){const row=await loadTrip(fromUrl.id);if(generation!==renderGeneration)return;trip=fromRow(row);done.clear();savedChecks(row).forEach(i=>done.add(i));loadedTrip=identity;}
  }

  if (!destinations.length) destinations = await getDestinations();
  if (trip && !countryName(trip.country)) trip = null;

  main.setAttribute("aria-busy", "true");
  const html = await route.view(param,topic);
  if(generation!==renderGeneration)return;
  main.innerHTML = html;
  main.removeAttribute("aria-busy");
  route.wire(param);

  document.querySelectorAll(".nav a").forEach((link) => {
    if (link.dataset.route === route.nav) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    // keep the trip in the nav links too
    if (link.dataset.route === "trip" || link.dataset.route === "plan") link.href = tripLink(link.dataset.route);
  });
  const guideTitle = name === "topic" ? renderedTopicTitle : name === "guide" ? guideById(param)?.title : null;
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
  button.addEventListener("click", () => {location.hash="#/account";}));

onSourceChange(({ mode, newestCheck }) => {
  const note = document.querySelector("#data-source");
  if (mode === "live") note.textContent = "Published facts come live from RoamReady.";
  if (mode === "snapshot") {
    const date = newestCheck ? new Date(`${newestCheck}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
    note.textContent = `Guide data is a saved copy${date ? ` from ${date}` : ""}.`;
    const retry=document.createElement('button');retry.type='button';retry.textContent='Retry live guide';retry.onclick=()=>{retryLive();destinations=[];render().catch(showLoadError);};note.append(' ',retry);
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
  document.querySelector("#retry-page").onclick=()=>render().catch(showLoadError);
}

// only "#/..." addresses are routes; anything else (an in-page anchor) is left alone
window.addEventListener("hashchange", () => {
  if (location.hash === "" || location.hash.startsWith("#/")) render().catch(showLoadError);
});
(async()=>{try{user=(await session())?.user||null;}catch{user=null;}await render();})().catch(showLoadError);
