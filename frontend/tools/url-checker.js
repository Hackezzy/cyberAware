// Page script for the URL Safety Checker. Ported from
// src/pages/tools/url-checker.astro's <script> block — same logic,
// loaded here as a real ES module (browsers support `import`/`export`
// natively; no bundler needed) instead of Astro bundling it.

import { analyzeUrl } from "../js/lib/url-checker.js";
import { markCompleted } from "../js/lib/progress-store.js";

// The backend's address. In real deployment this would point at wherever
// backend/app.py is actually hosted — for local development it's the
// Flask dev server's default address.
const BACKEND_URL = "http://localhost:5000";

const form = document.getElementById("check-form");
const urlInput = document.getElementById("url-input");
const sampleButtonsEl = document.getElementById("sample-buttons");
const resultsEl = document.getElementById("results");
const parseErrorEl = document.getElementById("parse-error");
const riskBanner = document.getElementById("risk-banner");
const riskLabelEl = document.getElementById("risk-label");
const riskScoreEl = document.getElementById("risk-score");
const breakdownListEl = document.getElementById("breakdown-list");
const flagsListEl = document.getElementById("flags-list");
const apiStatusEl = document.getElementById("api-status");

const RISK_BANNER_CLASS = {
  high: "risk-banner risk-banner--high",
  medium: "risk-banner risk-banner--medium",
  low: "risk-banner risk-banner--low",
};

const FLAG_BADGE_CLASS = {
  high: "flag-badge flag-badge--high",
  medium: "flag-badge flag-badge--medium",
  low: "flag-badge flag-badge--low",
};

const SEVERITY_LABEL = { high: "High", medium: "Medium", low: "Low" };

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

// --- Load sample URLs and build the buttons ---
let sampleUrls = [];
fetch("/data/sample-urls.json")
  .then((response) => response.json())
  .then((samples) => {
    sampleUrls = samples;
    sampleButtonsEl.innerHTML = samples
      .map(
        (sample) =>
          `<button type="button" class="sample-button" data-sample-id="${escapeHtml(sample.id)}">${escapeHtml(sample.label)}</button>`
      )
      .join("");
  });

sampleButtonsEl.addEventListener("click", (event) => {
  const target = event.target.closest("button[data-sample-id]");
  if (!target) return;
  const sample = sampleUrls.find((s) => s.id === target.dataset.sampleId);
  if (!sample) return;
  urlInput.value = sample.url;
  runCheck(sample.url);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runCheck(urlInput.value);
});

function runCheck(rawUrl) {
  const result = analyzeUrl(rawUrl);

  if (!result.valid) {
    resultsEl.hidden = true;
    parseErrorEl.textContent = rawUrl.trim()
      ? 'That doesn\'t look like a valid URL. Try including "https://" at the start.'
      : "Enter a URL above to check it.";
    parseErrorEl.hidden = false;
    return;
  }

  parseErrorEl.hidden = true;
  renderLocalResults(result);
  runRealApiCheck(rawUrl.trim());
}

function renderLocalResults(result) {
  markCompleted("tool-url-checker");

  riskBanner.className = RISK_BANNER_CLASS[result.riskLevel];
  riskLabelEl.textContent = result.riskLabel;
  riskScoreEl.textContent = `Score: ${result.score}/100 · ${result.flags.length} flag${result.flags.length === 1 ? "" : "s"} found`;

  const b = result.breakdown;
  const rows = [
    ["Protocol", b.protocol],
    ["Domain", b.hostname || "(none)"],
    ["Port", b.port],
    ["Path", b.path],
    ["Query parameters", b.queryParams.length ? b.queryParams.map((p) => `${p.key}=${p.value}`).join(", ") : "(none)"],
  ];
  breakdownListEl.innerHTML = rows
    .map(
      ([label, value]) =>
        `<li class="breakdown-item">${escapeHtml(label)}: <span>${escapeHtml(value)}</span></li>`
    )
    .join("");

  flagsListEl.innerHTML = result.flags.length
    ? result.flags
        .map(
          (flag) => `
        <li class="flag-card">
          <div class="flag-card-header">
            <span class="${FLAG_BADGE_CLASS[flag.severity]}">${SEVERITY_LABEL[flag.severity]}</span>
            <h4 class="flag-title">${escapeHtml(flag.title)}</h4>
          </div>
          <p class="flag-description">${escapeHtml(flag.description)}</p>
          ${flag.evidence ? `<p class="flag-evidence">${escapeHtml(flag.evidence)}</p>` : ""}
        </li>`
        )
        .join("")
    : `<li class="flag-card">No suspicious patterns detected by local analysis. That doesn't guarantee it's safe &mdash; the real check below adds a second, independent signal.</li>`;

  resultsEl.hidden = false;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  resultsEl.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
}

async function runRealApiCheck(url) {
  apiStatusEl.className = "api-status api-status--checking";
  apiStatusEl.textContent = "Checking against Google Safe Browsing…";

  try {
    const response = await fetch(`${BACKEND_URL}/api/check-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();

    if (!response.ok) {
      apiStatusEl.className = "api-status api-status--error";
      apiStatusEl.textContent = `Couldn't complete the real check: ${data.error || "unknown error"}. The backend may not be running, or has no API key configured yet — see backend/README.md.`;
      return;
    }

    if (data.isFlagged) {
      apiStatusEl.className = "api-status api-status--flagged";
      apiStatusEl.textContent = `⚠ Google Safe Browsing flags this URL for: ${data.threatTypes.join(", ")}.`;
    } else {
      apiStatusEl.className = "api-status api-status--clean";
      apiStatusEl.textContent = "✓ Not currently flagged by Google Safe Browsing.";
    }
  } catch (error) {
    apiStatusEl.className = "api-status api-status--error";
    apiStatusEl.textContent = `Couldn't reach the backend at ${BACKEND_URL} — is it running? (See backend/README.md.)`;
  }
}
