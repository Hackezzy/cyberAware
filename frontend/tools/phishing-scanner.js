// Page script for the Phishing Email Scanner. Ported from
// src/pages/tools/phishing-scanner.astro's <script> block.

import { analyzeEmail } from "../js/lib/phishing-detector.js";
import { markCompleted } from "../js/lib/progress-store.js";

const form = document.getElementById("scan-form");
const resultsEl = document.getElementById("results");
const clearBtn = document.getElementById("clear-form");
const sampleButtonsEl = document.getElementById("sample-buttons");

const fields = {
  fromName: document.getElementById("from-name"),
  fromEmail: document.getElementById("from-email"),
  replyTo: document.getElementById("reply-to"),
  subject: document.getElementById("subject"),
  body: document.getElementById("body"),
};

const SEVERITY_LABEL = { high: "High", medium: "Medium", low: "Low" };
const FLAG_BADGE_CLASS = {
  high: "flag-badge flag-badge--high",
  medium: "flag-badge flag-badge--medium",
  low: "flag-badge flag-badge--low",
};
const RISK_BANNER_CLASS = {
  high: "risk-banner risk-banner--high",
  medium: "risk-banner risk-banner--medium",
  low: "risk-banner risk-banner--low",
};

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

let sampleEmails = [];
fetch("/data/sample-emails.json")
  .then((response) => response.json())
  .then((samples) => {
    sampleEmails = samples;
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
  const sample = sampleEmails.find((s) => s.id === target.dataset.sampleId);
  if (!sample) return;

  fields.fromName.value = sample.from.name;
  fields.fromEmail.value = sample.from.email;
  fields.replyTo.value = sample.replyTo ?? "";
  fields.subject.value = sample.subject;
  fields.body.value = sample.body;

  resultsEl.hidden = true;
  resultsEl.innerHTML = "";
});

clearBtn.addEventListener("click", () => {
  form.reset();
  resultsEl.hidden = true;
  resultsEl.innerHTML = "";
  fields.fromName.focus();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = {
    from: { name: fields.fromName.value.trim(), email: fields.fromEmail.value.trim() },
    replyTo: fields.replyTo.value.trim() || undefined,
    subject: fields.subject.value.trim(),
    body: fields.body.value,
  };

  const result = analyzeEmail(email);
  renderResults(result);
});

function renderResults(result) {
  markCompleted("tool-phishing-scanner");

  const flagsHtml = result.flags.length
    ? result.flags
        .map(
          (flag) => `
        <li class="flag-card">
          <div class="flag-card-header">
            <span class="${FLAG_BADGE_CLASS[flag.severity]}">${SEVERITY_LABEL[flag.severity]}</span>
            <h3 class="flag-title">${escapeHtml(flag.title)}</h3>
          </div>
          <p class="flag-description">${escapeHtml(flag.description)}</p>
          ${flag.evidence ? `<p class="flag-evidence">${escapeHtml(flag.evidence)}</p>` : ""}
        </li>`
        )
        .join("")
    : `<li class="flag-card">No red flags detected by this tool. That doesn't guarantee the email is safe &mdash; stay cautious with unexpected requests.</li>`;

  const linksHtml = result.links.length
    ? `
      <div class="results-block">
        <h3 class="section-label">Links found in this email</h3>
        <ul class="breakdown-list">
          ${result.links
            .map(
              (link) => `
            <li class="breakdown-item">
              <span style="color: var(--color-text);">${escapeHtml(link.text)}</span>
              <span aria-hidden="true"> &rarr; </span>
              <span class="sr-only">links to</span>
              ${escapeHtml(link.href)}
            </li>`
            )
            .join("")}
        </ul>
        <p class="form-hint" style="margin-top: 0.5rem;">Links are shown as text only and are never made clickable by this tool.</p>
      </div>`
    : "";

  resultsEl.innerHTML = `
    <div class="${RISK_BANNER_CLASS[result.riskLevel]}">
      <p class="risk-banner-label">Risk assessment</p>
      <p class="risk-banner-value">${escapeHtml(result.riskLabel)}</p>
      <p class="risk-banner-score">Score: ${result.score}/100 &middot; ${result.flags.length} flag${result.flags.length === 1 ? "" : "s"} found</p>
    </div>
    <ul class="flags-list" style="margin-top: 1.5rem;">${flagsHtml}</ul>
    ${linksHtml}
  `;
  resultsEl.hidden = false;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  resultsEl.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
}
