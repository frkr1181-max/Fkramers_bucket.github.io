import { categories, demoTasks, destination } from "./data.js";

const app = document.querySelector("#app");
// Guest plans intentionally live only in page memory. Refreshing or closing
// the page clears the plan; account-backed saving is a separate future flow.
let guestTrip = null;
let selectedCategory = "entry";

function readTrip() {
  return guestTrip;
}

function saveTrip(trip) {
  guestTrip = trip;
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function tripTiming(trip) {
  const start = trip.startDate || trip.date;
  const end = trip.returnDate;
  if (start && end) {
    const [startYear, startMonth, startDay] = start.split("-").map(Number);
    const [endYear, endMonth, endDay] = end.split("-").map(Number);
    const startTime = Date.UTC(startYear, startMonth - 1, startDay);
    const endTime = Date.UTC(endYear, endMonth - 1, endDay);
    const nights = Math.round((endTime - startTime) / 86_400_000);
    const days = nights + 1;
    const length = nights === 0
      ? "1 day"
      : `${nights} ${nights === 1 ? "night" : "nights"} · ${days} days`;
    return `${formatDate(start)} – ${formatDate(end)} · ${length}`;
  }
  if (trip.estimatedDuration?.value) {
    const { value, unit } = trip.estimatedDuration;
    const estimate = `estimated stay: ${value} ${unit}${value === 1 ? "" : "s"}`;
    return start ? `Starting ${formatDate(start)} · ${estimate}` : `Estimated stay: ${value} ${unit}${value === 1 ? "" : "s"}`;
  }
  if (start) return `Starting ${formatDate(start)} · return date not set`;
  return "Dates and trip length not set";
}

function stayDayRange(trip) {
  const start = trip.startDate || trip.date;
  if (start && trip.returnDate) {
    const [startYear, startMonth, startDay] = start.split("-").map(Number);
    const [endYear, endMonth, endDay] = trip.returnDate.split("-").map(Number);
    const startTime = Date.UTC(startYear, startMonth - 1, startDay);
    const endTime = Date.UTC(endYear, endMonth - 1, endDay);
    const days = Math.round((endTime - startTime) / 86_400_000) + 1;
    return { min: days, max: days, estimated: false };
  }
  const duration = trip.estimatedDuration;
  if (!duration?.value) return null;
  const daysPerUnit = {
    day: [1, 1],
    week: [7, 7],
    month: [28, 31],
    year: [365, 366],
  }[duration.unit];
  if (!daysPerUnit) return null;
  return {
    min: duration.value * daysPerUnit[0],
    max: duration.value * daysPerUnit[1],
    estimated: true,
  };
}

function stayBandLabel(trip) {
  const range = stayDayRange(trip);
  if (!range) return "stay length not set";
  if (range.max <= 90) return "up to 90 days";
  if (range.min > 90) return "more than 90 days";
  return "estimated near the 90-day line";
}

const purposeLabels = {
  tourism: "Vacation or tourism",
  business: "Business",
  study: "Study",
  work: "Work",
  family: "Visiting family or friends",
  "long-term": "Long-term stay or relocation",
  transit: "Transit",
};

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
        <h1>Get ready for your trip</h1>
        <p>Bring the essentials together in one clear plan, with official sources behind the details.</p>
        <button class="button primary" data-action="plan">Start planning <span aria-hidden="true">→</span></button>
        <p class="small-note">The sample content in this preview is for layout demonstration only.</p>
      </div>
      <div class="hero-card" aria-label="Illustration placeholder">
        <div class="route-line"></div><span class="map-pin">●</span><span class="map-label">Your trip, made clearer</span>
      </div>
    </section>
    <section class="how wrap">
      <div class="section-heading"><p class="eyebrow">How RoamReady works</p><h2>Three steps to feel prepared</h2></div>
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
  const existingTrip = readTrip();
  app.innerHTML = `
    <section class="wrap page-section">
      <div class="section-heading"><p class="eyebrow">Plan a trip · Step 1 of 2</p><h1>Let’s get prepared</h1><p>Start with the details that shape your checklist. You can edit them later.</p></div>
      <form id="trip-form" class="plan-layout">
        <div class="form-card">
          <label for="destination">Where are you going?</label>
          <select id="destination" name="destination"><option>${destination.name}</option></select>
          <p class="field-label">When are you traveling? <span class="optional">Optional</span></p>
          <div class="date-fields">
            <label for="trip-start-date">Start date</label>
            <input id="trip-start-date" name="trip-start-date" type="date" value="${escapeHtml(existingTrip?.startDate || existingTrip?.date || "")}" />
            <label for="trip-return-date">Return date</label>
            <input id="trip-return-date" name="trip-return-date" type="date" value="${escapeHtml(existingTrip?.returnDate || "")}" />
          </div>
          <p class="small-note timing-help">If you don’t know your return date, enter an estimated stay length instead.</p>
          <div class="duration-fields">
            <label for="duration-value">Estimated stay length</label>
            <div class="duration-inputs">
              <input id="duration-value" name="duration-value" type="number" min="1" step="1" inputmode="numeric" placeholder="For example, 6" value="${escapeHtml(existingTrip?.estimatedDuration?.value || "")}" />
              <select id="duration-unit" name="duration-unit" aria-label="Estimated stay length unit">
                <option value="day" ${existingTrip?.estimatedDuration?.unit === "day" ? "selected" : ""}>Days</option><option value="week" ${existingTrip?.estimatedDuration?.unit === "week" ? "selected" : ""}>Weeks</option><option value="month" ${existingTrip?.estimatedDuration?.unit === "month" ? "selected" : ""}>Months</option><option value="year" ${existingTrip?.estimatedDuration?.unit === "year" ? "selected" : ""}>Years</option>
              </select>
            </div>
          </div>
          <p id="trip-form-error" class="form-error" role="alert" hidden></p>
          <fieldset><legend>How much have you traveled on your own?</legend>
            <label class="choice"><input type="radio" name="experience" value="first-solo" ${!existingTrip?.experience || existingTrip.experience === "first-solo" ? "checked" : ""} /> First solo trip</label>
            <label class="choice"><input type="radio" name="experience" value="some" ${existingTrip?.experience === "some" ? "checked" : ""} /> I’ve traveled solo before</label>
          </fieldset>
          <label for="trip-purpose">What’s the trip for? <span class="optional">Optional</span></label>
          <select id="trip-purpose" name="purpose"><option value="tourism" ${!existingTrip?.purpose || existingTrip.purpose === "tourism" ? "selected" : ""}>Vacation or tourism</option><option value="business" ${existingTrip?.purpose === "business" ? "selected" : ""}>Business</option><option value="study" ${existingTrip?.purpose === "study" ? "selected" : ""}>Study</option><option value="work" ${existingTrip?.purpose === "work" ? "selected" : ""}>Work</option><option value="family" ${existingTrip?.purpose === "family" ? "selected" : ""}>Visiting family or friends</option><option value="long-term" ${existingTrip?.purpose === "long-term" ? "selected" : ""}>Long-term stay or relocation</option><option value="transit" ${existingTrip?.purpose === "transit" ? "selected" : ""}>Transit</option></select>
          <button class="button primary" type="submit">Create my plan <span aria-hidden="true">→</span></button>
        </div>
        <aside class="side-note"><span class="side-icon">✦</span><h2>Your plan will include</h2><p>A checklist and guides for the parts of your trip that need preparation.</p>
          <ul><li>Entry and documents</li><li>Getting there and around</li><li>Safety and emergency contacts</li></ul>
          <p class="small-note">Guest plan: your trip details stay only while this page is open. Refreshing or closing the page clears them.</p>
        </aside>
      </form>
    </section>
  `;
  const returnDate = app.querySelector("#trip-return-date");
  const durationValue = app.querySelector("#duration-value");
  const durationUnit = app.querySelector("#duration-unit");
  const syncDurationFields = () => {
    const hasReturnDate = Boolean(returnDate.value);
    durationValue.disabled = hasReturnDate;
    durationUnit.disabled = hasReturnDate;
    if (hasReturnDate) durationValue.value = "";
  };
  returnDate.addEventListener("change", syncDurationFields);
  syncDurationFields();
  app.querySelector("#trip-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startDate = form.get("trip-start-date");
    const returnDateValue = form.get("trip-return-date");
    const error = app.querySelector("#trip-form-error");
    if (returnDateValue && !startDate) {
      error.textContent = "Add a start date before entering a return date.";
      error.hidden = false;
      return;
    }
    if (startDate && returnDateValue && returnDateValue <= startDate) {
      error.textContent = "The return date must be after the start date.";
      error.hidden = false;
      return;
    }
    error.hidden = true;
    const durationValue = form.get("duration-value");
    const estimatedDuration = !returnDateValue && durationValue
      ? { value: Number(durationValue), unit: form.get("duration-unit") }
      : null;
    const trip = {
      destination: destination.name,
      startDate,
      returnDate: returnDateValue,
      estimatedDuration,
      purpose: form.get("purpose"),
      experience: form.get("experience"),
      completed: existingTrip?.completed || [],
    };
    const stayRange = stayDayRange(trip);
    saveTrip({
      ...trip,
      stayDaysMin: stayRange?.min ?? null,
      stayDaysMax: stayRange?.max ?? null,
      stayBand: stayBandLabel(trip),
    });
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
      <div class="trip-title"><div><p class="eyebrow">Your trip · ${escapeHtml(purposeLabels[trip.purpose] || purposeLabels.tourism)} · ${escapeHtml(trip.stayBand || stayBandLabel(trip))}</p><h1>Your trip to ${escapeHtml(destination.name)}</h1><p>${escapeHtml(tripTiming(trip))}</p></div><button class="button secondary" data-action="edit">Edit trip</button></div>
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
