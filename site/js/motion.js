// the bouncy layer. main.js calls enter() after every page change; the actual
// curves and keyframes live in css/motion.css. nothing here is needed for the
// site to work: if this file fails, pages simply appear without motion.

import { playLogoBuild } from "./logo-build.js";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// entrances happen on two screens only. the trip dashboard (David, Nov 10):
// its title, chips and guide tiles arrive in that order. and Home, where the
// logo builds itself in the hero (David, Nov 11: it replaced the slowly
// spinning rings). everything else is simply there when the page opens, with
// no entrance and nothing that waits for a scroll.
// "rise" is for big blocks, "pop" for small repeated pieces, "card" is the
// slower pop the guide tiles use.
// base is when the group starts, in ms after the page appears
const GROUPS = [
  { kind: "rr-rise", base: 0, selector: ".trip .trip-head" },
  { kind: "rr-pop", base: 60, selector: ".trip .chips > li" },
  { kind: "rr-card", base: 120, selector: ".trip .tiles > li" },
];

export function enter(root) {
  for (const group of GROUPS) {
    root.querySelectorAll(group.selector).forEach((el, i) => {
      el.classList.add(group.kind);
      el.style.setProperty("--i", i);
      el.style.setProperty("--base", `${group.base}ms`);
    });
  }
  playLogoBuild(root.querySelector("[data-logo-build]"));
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
