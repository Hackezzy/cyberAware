/**
 * Reusable simulation scene-stepping engine.
 *
 * The Astro version never actually had this as a shared file — each of the
 * 8 simulation pages copy-pasted this same ~130-line script inline, with
 * only the total scene count and the progress-tracking itemId differing.
 * That's a real duplication the plain-HTML rebuild doesn't need to carry
 * forward: this file is the one, real, shared engine every simulation page
 * imports and calls, the same relationship quiz-engine.js already has with
 * every quiz page.
 *
 * Operates on a fixed "shell" of expected element IDs/data-attributes
 * already present in the page:
 *   - elements with [data-scene-index] — one per scene, in document order
 *   - elements with [data-pill-index] — the step-indicator buttons
 *   - #step-indicator, #prev-step, #next-step
 *
 * A new simulation page only needs to write its own scenes' HTML content,
 * then call createSimulation({ root, totalSteps, itemId }).
 */

import { markCompleted } from "./progress-store.js";

/**
 * @param {{ root: HTMLElement, totalSteps: number, itemId?: string }} config
 */
export function createSimulation({ root, totalSteps, itemId }) {
  const sceneEls = Array.from(root.querySelectorAll("[data-scene-index]")).sort(
    (a, b) => Number(a.dataset.sceneIndex) - Number(b.dataset.sceneIndex)
  );
  const pillEls = Array.from(root.querySelectorAll("[data-pill-index]")).sort(
    (a, b) => Number(a.dataset.pillIndex) - Number(b.dataset.pillIndex)
  );
  const stepIndicator = root.querySelector("#step-indicator");
  const prevBtn = root.querySelector("#prev-step");
  const nextBtn = root.querySelector("#next-step");

  let currentIndex = 0;

  // Progressive enhancement: every scene is visible in the raw HTML. Only
  // hide the non-first scenes once JS actually runs, so a JS failure falls
  // back to "show everything," never a blank page.
  sceneEls.forEach((scene, i) => {
    if (i !== 0) scene.hidden = true;
  });

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function updateChrome() {
    stepIndicator.textContent = `Step ${currentIndex + 1} of ${totalSteps}`;

    pillEls.forEach((pill, i) => {
      const isActive = i === currentIndex;
      pill.classList.toggle("sim-pill--active", isActive);
      pill.classList.toggle("sim-pill--inactive", !isActive);
      if (isActive) {
        pill.setAttribute("aria-current", "step");
      } else {
        pill.removeAttribute("aria-current");
      }
    });

    prevBtn.disabled = currentIndex === 0;
    nextBtn.textContent = currentIndex === totalSteps - 1 ? "Restart" : "Next";

    if (currentIndex === totalSteps - 1 && itemId) {
      markCompleted(itemId);
    }
  }

  function goToStep(newIndex) {
    if (newIndex === currentIndex) return;

    // currentIndex (and the visible chrome) update synchronously,
    // immediately, decoupled from the fade animation's timing — a rapid
    // double/triple-click on Next must never read a stale currentIndex.
    const oldEl = sceneEls[currentIndex];
    const newEl = sceneEls[newIndex];
    currentIndex = newIndex;
    updateChrome();

    const focusNewHeading = () => {
      newEl.querySelector("h2")?.focus();
    };

    if (prefersReducedMotion()) {
      oldEl.hidden = true;
      newEl.hidden = false;
      focusNewHeading();
      return;
    }

    oldEl.classList.add("scene--fade-out");
    window.setTimeout(() => {
      oldEl.hidden = true;
      oldEl.classList.remove("scene--fade-out");

      newEl.classList.add("scene--fade-out");
      newEl.hidden = false;
      // Force a reflow so the browser registers the starting opacity-0
      // state before it's removed, otherwise there's nothing to fade from.
      void newEl.offsetWidth;
      newEl.classList.remove("scene--fade-out");

      focusNewHeading();
    }, 150);
  }

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) goToStep(currentIndex - 1);
  });

  nextBtn.addEventListener("click", () => {
    if (currentIndex === totalSteps - 1) {
      goToStep(0);
    } else {
      goToStep(currentIndex + 1);
    }
  });

  pillEls.forEach((pill, i) => {
    pill.addEventListener("click", () => goToStep(i));
  });

  // Arrow-key navigation, scoped to when focus is already on the nav
  // buttons or inside the walkthrough itself — deliberately not hijacking
  // arrow keys elsewhere on the page (e.g. in the nav bar).
  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const active = document.activeElement;
    const withinWalkthrough =
      active === prevBtn || active === nextBtn || pillEls.includes(active) || sceneEls.some((scene) => scene.contains(active));
    if (!withinWalkthrough) return;

    event.preventDefault();
    if (event.key === "ArrowLeft" && currentIndex > 0) goToStep(currentIndex - 1);
    if (event.key === "ArrowRight" && currentIndex < totalSteps - 1) goToStep(currentIndex + 1);
  });

  updateChrome();
}
