// the bouncy layer. main.js calls enter() after every page change; the actual
// curves and keyframes live in css/motion.css. nothing here is needed for the
// site to work: if this file fails, pages simply appear without motion.

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// what animates on each page, in the order it should arrive.
// "rise" is for big blocks (cards, titles), "pop" for small repeated pieces.
// base is when the group starts, in ms after the page appears.
// the dashboard's checklist and trip essentials are left out on purpose: they
// sit below the tiles and are simply there from the start, with no entrance
// and no scroll-in (David, Nov 10)
const GROUPS = [
  { kind: "rr-rise", base: 0, selector: ".page-title, .hero > div:first-child > h1, .hero > div:first-child > .lead, .trip-head, .guide-head" },
  { kind: "rr-rise", base: 90, selector: ".login, .plan-form, .plan-preview, .sidebar, .empty, .sources" },
  { kind: "rr-pop", base: 60, selector: ".chips > li" },
  { kind: "rr-pop", base: 120, selector: ".tiles > li, .topics > li" },
  { kind: "rr-pop", base: 220, selector: ".plan-preview .stage" },
  { kind: "rr-pop", base: 200, selector: ".source-list > li" },
  { kind: "rr-pop", base: 0, selector: ".steps > li, .trust-tiles > li" },
  { kind: "rr-rise", base: 120, selector: ".trust-photo" },
];

let observer = null;

export function enter(root) {
  observer?.disconnect();
  const below = [];
  for (const group of GROUPS) {
    root.querySelectorAll(group.selector).forEach((el, i) => {
      el.classList.add(group.kind);
      el.style.setProperty("--i", i);
      el.style.setProperty("--base", `${group.base}ms`);
      // anything starting below the fold waits until it scrolls into view
      if (el.getBoundingClientRect().top > window.innerHeight) below.push(el);
    });
  }
  if (below.length && "IntersectionObserver" in window && !reduceMotion()) {
    below.forEach((el) => el.classList.add("rr-wait"));
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove("rr-wait");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -80px 0px" });
    below.forEach((el) => observer.observe(el));
  }
  drawArcsOnce(root);
}

// the band arcs draw themselves on the first page that has them, once per visit
// (the Figma spec: "arcs draw on once in 0.9s"). later pages keep the static image
let arcsDrawn = false;
async function drawArcsOnce(root) {
  const img = root.querySelector(".band img.arcs");
  if (arcsDrawn || !img || reduceMotion()) return;
  arcsDrawn = true;
  try {
    const text = await (await fetch(img.getAttribute("src"))).text();
    const holder = document.createElement("div");
    holder.innerHTML = text;
    const svg = holder.querySelector("svg");
    if (!svg || !img.isConnected) return;
    svg.setAttribute("class", "arcs arcs-live");
    svg.setAttribute("aria-hidden", "true");
    svg.removeAttribute("style");
    svg.querySelectorAll("path, circle").forEach((shape, i) => {
      const delay = `${Math.min(i * 0.015, 0.5)}s`;
      shape.style.setProperty("--delay", delay);
      if (shape.getAttribute("stroke") && shape.tagName === "path") {
        shape.style.setProperty("--len", Math.ceil(shape.getTotalLength()));
        shape.classList.add("draw");
      } else {
        shape.classList.add("pop");
      }
    });
    img.replaceWith(svg);
  } catch {
    // keep the static image
  }
}

// dialogs leave with a quick fade instead of vanishing. covers the close
// button (form method="dialog"), Escape, and clicks on the dimmed backdrop
export function closeDialog(dialog, value) {
  if (!dialog.open || dialog.classList.contains("closing")) return;
  if (reduceMotion()) return dialog.close(value);
  dialog.classList.add("closing");
  const finish = () => {
    dialog.classList.remove("closing");
    dialog.close(value);
  };
  // wait for the dialog's own exit animation (the backdrop's fade fires animationend too)
  const onEnd = (event) => {
    if (event.animationName !== "rr-dialog-out" || event.pseudoElement) return;
    dialog.removeEventListener("animationend", onEnd);
    finish();
  };
  dialog.addEventListener("animationend", onEnd);
  setTimeout(() => dialog.open && dialog.classList.contains("closing") && finish(), 250);
}

export function wireDialogs(dialogs) {
  for (const dialog of dialogs) {
    // Escape: handled on keydown, because browsers may ignore preventDefault()
    // on the dialog's own cancel event; cancel stays as a fallback
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDialog(dialog);
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog(dialog);
    });
    dialog.addEventListener("submit", (event) => {
      if (event.target.method !== "dialog") return;
      event.preventDefault();
      closeDialog(dialog, event.submitter?.value);
    });
    // only clicks outside the dialog's box (on the dimmed backdrop) close it
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside) closeDialog(dialog);
    });
  }
}

// a small "no" shake on a field that needs fixing
export function shake(el) {
  if (!el || reduceMotion() || !el.animate) return;
  el.animate(
    [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(7px)" },
      { transform: "translateX(-5px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }],
    { duration: 380, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
  );
}

// the phone menu's links drop in one after another
export function staggerMenu(nav) {
  [...nav.children].forEach((el, i) => el.style.setProperty("--i", i));
}
