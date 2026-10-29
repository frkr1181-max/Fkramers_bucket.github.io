import { categories, demoTasks, destination } from "./data.js";

const app = document.querySelector("#app");
const tripKey = "roamready-demo-trip";
let selectedCategory = "entry";

function readTrip() {
  try {
    return JSON.parse(sessionStorage.getItem(tripKey) || "null");
  } catch {
    return null;
  }
}

function saveTrip(trip) {
  sessionStorage.setItem(tripKey, JSON.stringify(trip));
}

function setActiveNav(view) {
  document.querySelectorAll("[data-view]").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });
}

function renderHome() {
  setActiveNav("home");
  app.innerHTML = `
    <section class="hero wrap">
      <div class="hero-copy">
        <p class="eyebrow">A calmer way to get ready</p>
        <h1>Get ready for your first solo trip</h1>
        <p>Bring the essentials together in one clear plan, with official sources behind the details.</p>
        <button class="button primary" data-action="plan">Start planning <span aria-hidden="true">→</span></button>
        <p class="small-note">The sample content in this preview is for layout demonstration only.</p>
      </div>
      <div class="hero-card" aria-label="Illustration placeholder">
        <div class="route-line"></div><span class="map-pin">●</span><span class="map-label">Your trip, made clearer</span>
      </div>
    </section>
    <section class="how wrap">
      <div class="section-heading"><p class="eyebrow">How RoamReady works</p><h2>Three steps from booking to boarding</h2></div>
      <div class="steps">
        <article class="step-card"><span class="step-number">01</span><h3>Tell us about your trip</h3><p>Choose a destination and a few planning details.</p></article>
        <article class="step-card"><span class="step-number">02</span><h3>Get your checklist and guide</h3><p>See the topics to review, with source links beside the guidance.</p></article>
        <article class="step-card"><span class="step-number">03</span><h3>Ask a question</h3><p>Explore a source-grounded assistant after the core flow is ready.</p></article>
      </div>
    </section>
  `;
  app.querySelector('[data-action="plan"]').addEventListener("click", renderPlan);
}

function renderPlan() {
  setActiveNav("plan");
  app.innerHTML = `
    <section class="wrap page-section">
      <div class="section-heading"><p class="eyebrow">Plan a trip · Step 1 of 2</p><h1>Let’s get prepared</h1><p>Start with the details that shape your checklist. You can edit them later.</p></div>
      <form id="trip-form" class="plan-layout">
        <div class="form-card">
          <label for="destination">Where are you going?</label>
          <select id="destination" name="destination"><option>${destination.name}</option></select>
          <label for="trip-date">When are you traveling? <span class="optional">Optional</span></label>
          <input id="trip-date" name="trip-date" type="date" />
          <fieldset><legend>How much have you traveled on your own?</legend>
            <label class="choice"><input type="radio" name="experience" value="first-solo" checked /> First solo trip</label>
            <label class="choice"><input type="radio" name="experience" value="some" /> I’ve traveled solo before</label>
          </fieldset>
          <label for="trip-purpose">What’s the trip for? <span class="optional">Optional</span></label>
          <select id="trip-purpose" name="purpose"><option>Vacation</option><option>Study</option><option>Visiting family</option><option>Work</option></select>
          <button class="button primary" type="submit">Create my plan <span aria-hidden="true">→</span></button>
        </div>
        <aside class="side-note"><span class="side-icon">✦</span><h2>Your plan will include</h2><p>A checklist and guides for the parts of your trip that need preparation.</p>
          <ul><li>Entry and documents</li><li>Getting there and around</li><li>Safety and emergency contacts</li></ul>
          <p class="small-note">This demo keeps trip details in this browser tab only.</p>
        </aside>
      </form>
    </section>
  `;
  app.querySelector("#trip-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveTrip({ destination: destination.name, date: form.get("trip-date"), purpose: form.get("purpose"), experience: form.get("experience"), completed: [] });
    renderTrip();
  });
}

function renderTrip() {
  setActiveNav("trip");
  const trip = readTrip();
  if (!trip) return renderPlan();
  const completed = new Set(trip.completed || []);
  const pct = Math.round((completed.size / demoTasks.length) * 100);
  app.innerHTML = `
    <section class="wrap page-section">
      <div class="trip-title"><div><p class="eyebrow">Your trip · ${escapeHtml(trip.purpose || "Vacation")}</p><h1>Your trip to ${escapeHtml(destination.name)}</h1><p>${escapeHtml(trip.destination)}${trip.date ? ` · ${escapeHtml(trip.date)}` : ""}</p></div><button class="button secondary" data-action="edit">Edit trip</button></div>
      <div class="dashboard-layout">
        <section class="main-column">
          <p class="eyebrow">Your preparation guide</p><div class="category-grid">${categories.map((item) => `<button class="category-card ${selectedCategory === item.id ? "selected" : ""}" data-category="${item.id}"><span class="category-icon">${item.icon}</span><span class="card-group">${item.group}</span><strong>${item.title}</strong><span>${item.description}</span><span class="card-link">Open guide →</span></button>`).join("")}</div>
          <article class="checklist-card"><div class="card-heading"><div><p class="eyebrow">Before you leave</p><h2>Your checklist</h2></div><strong>${completed.size} of ${demoTasks.length}</strong></div><div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
            ${demoTasks.map((task, index) => `<label class="task-row"><input type="checkbox" data-task="${index}" ${completed.has(index) ? "checked" : ""} /><span>${task}</span><small>Demo checklist item</small></label>`).join("")}
          </article>
        </section>
        <aside class="detail-card"><div class="detail-heading"><span class="category-icon">${categories.find((item) => item.id === selectedCategory)?.icon || "▤"}</span><div><p class="eyebrow">${categories.find((item) => item.id === selectedCategory)?.group || "Prepare"}</p><h2>${categories.find((item) => item.id === selectedCategory)?.title || "Travel guide"}</h2></div></div><p class="demo-callout">This section is a content placeholder. Add only reviewed guidance with a working official source before the prototype is used for travel decisions.</p><h3>Sources for this page</h3><p class="source-placeholder">No reviewed sources have been connected yet.</p><button class="button text-button" data-action="edit">Edit trip details</button></aside>
      </div>
    </section>
  `;
  app.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => { selectedCategory = button.dataset.category; renderTrip(); }));
  app.querySelectorAll('[data-action="edit"]').forEach((button) => button.addEventListener("click", renderPlan));
  app.querySelectorAll("[data-task]").forEach((checkbox) => checkbox.addEventListener("change", () => {
    const next = new Set(readTrip()?.completed || []);
    const index = Number(checkbox.dataset.task);
    checkbox.checked ? next.add(index) : next.delete(index);
    saveTrip({ ...readTrip(), completed: [...next] });
    renderTrip();
  }));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

document.querySelectorAll("[data-view]").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  const view = link.dataset.view;
  if (view === "home") renderHome();
  if (view === "plan") renderPlan();
  if (view === "trip") renderTrip();
}));

renderHome();
