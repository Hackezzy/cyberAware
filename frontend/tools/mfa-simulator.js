// Page script for the MFA Simulator. Ported from
// src/pages/tools/mfa-simulator.astro's <script> block.

import { markCompleted } from "../js/lib/progress-store.js";

const tabs = Array.from(document.querySelectorAll("[data-method-id]"));
const panels = Array.from(document.querySelectorAll("[data-method-panel]"));

function selectMethod(id) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.methodId === id;
    tab.setAttribute("aria-selected", String(isActive));
    tab.classList.toggle("sim-pill--active", isActive);
    tab.classList.toggle("sim-pill--inactive", !isActive);
  });

  panels.forEach((panel) => {
    const isActive = panel.dataset.methodPanel === id;
    panel.hidden = !isActive;
    if (isActive) {
      markCompleted("tool-mfa-simulator");
      panel.querySelector("h2")?.focus();
    }
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => selectMethod(tab.dataset.methodId));
});

// Mark completed on load too, since the first panel is visible by default
// without requiring a click.
markCompleted("tool-mfa-simulator");

// --- MFA-fatigue interactive demo ---
const startBtn = document.getElementById("start-fatigue-demo");
if (startBtn) {
  const statusEl = document.getElementById("fatigue-status");
  const promptEl = document.getElementById("fatigue-prompt");
  const denyBtn = document.getElementById("fatigue-deny");
  const approveBtn = document.getElementById("fatigue-approve");
  const resultEl = document.getElementById("fatigue-result");
  const resultTextEl = document.getElementById("fatigue-result-text");

  const TOTAL_PROMPTS = 5;
  let promptIndex = 0;
  let deniedCount = 0;

  function showNextPrompt() {
    if (promptIndex >= TOTAL_PROMPTS) {
      finish();
      return;
    }
    promptIndex += 1;
    statusEl.textContent = `Request ${promptIndex} of ${TOTAL_PROMPTS}`;
    promptEl.hidden = false;
    denyBtn.focus();
  }

  function finish() {
    promptEl.hidden = true;
    statusEl.textContent = "";
    resultEl.hidden = false;
    const allDenied = deniedCount === TOTAL_PROMPTS;
    resultTextEl.textContent = allDenied
      ? `You denied all ${TOTAL_PROMPTS} attempts — that's the correct response every time.`
      : `You denied ${deniedCount} of ${TOTAL_PROMPTS} attempts. Even one "Approve" during a real attack hands over full access.`;
    resultEl.className = allDenied
      ? "explanation-panel explanation-panel--correct"
      : "explanation-panel explanation-panel--incorrect";
    resultTextEl.className = allDenied
      ? "explanation-result explanation-result--correct"
      : "explanation-result explanation-result--incorrect";
    startBtn.textContent = "Try again";
    startBtn.hidden = false;
  }

  startBtn.addEventListener("click", () => {
    promptIndex = 0;
    deniedCount = 0;
    resultEl.hidden = true;
    startBtn.hidden = true;
    showNextPrompt();
  });

  denyBtn.addEventListener("click", () => {
    deniedCount += 1;
    promptEl.hidden = true;
    window.setTimeout(showNextPrompt, 200);
  });

  approveBtn.addEventListener("click", () => {
    promptEl.hidden = true;
    window.setTimeout(showNextPrompt, 200);
  });
}
