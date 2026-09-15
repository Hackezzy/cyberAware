// Page script for the Password Strength Analyzer. Ported from
// src/pages/tools/password-strength.astro's <script> block.

import { analyzePassword } from "../js/lib/password-analyzer.js";
import { analyzeCredentialReuse } from "../js/lib/credential-reuse-analyzer.js";
import { markCompleted, isCompleted } from "../js/lib/progress-store.js";

const input = document.getElementById("password-input");
const toggleBtn = document.getElementById("toggle-visibility");
const strengthLive = document.getElementById("strength-live");
const strengthLabel = document.getElementById("strength-label");
const strengthScore = document.getElementById("strength-score");
const barTrack = document.getElementById("strength-bar-track");
const barFill = document.getElementById("strength-bar-fill");
const characterClassesEl = document.getElementById("character-classes");
const crackTimeEl = document.getElementById("crack-time");
const flagsListEl = document.getElementById("flags-list");

const LEVEL_FILL_CLASS = {
  "very-weak": "strength-bar-fill--danger",
  weak: "strength-bar-fill--danger",
  fair: "strength-bar-fill--warning",
  strong: "strength-bar-fill--safe",
  "very-strong": "strength-bar-fill--safe",
};

const SEVERITY_BADGE_CLASS = {
  high: "flag-badge flag-badge--high",
  medium: "flag-badge flag-badge--medium",
  low: "flag-badge flag-badge--low",
};
const SEVERITY_LABEL = { high: "High", medium: "Medium", low: "Low" };

const CLASS_LABELS = {
  lower: "lowercase",
  upper: "UPPERCASE",
  digit: "0-9",
  symbol: "symbol",
};

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

let lastAnnouncedLabel = "";

toggleBtn.addEventListener("click", () => {
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  toggleBtn.textContent = isHidden ? "Hide" : "Show";
  toggleBtn.setAttribute("aria-pressed", String(isHidden));
  input.focus();
});

input.addEventListener("input", () => {
  const result = analyzePassword(input.value);

  if (input.value && !isCompleted("tool-password-strength")) {
    markCompleted("tool-password-strength");
  }

  strengthLabel.textContent = `Strength: ${input.value ? result.label : "—"}`;
  strengthScore.textContent = `${result.score} / 100`;
  barTrack.setAttribute("aria-valuenow", String(result.score));
  barTrack.setAttribute("aria-valuetext", result.label);
  barFill.style.width = `${result.score}%`;
  barFill.className = `strength-bar-fill ${LEVEL_FILL_CLASS[result.level]}`;

  if (input.value && result.label !== lastAnnouncedLabel) {
    strengthLive.textContent = `Password strength: ${result.label}`;
    lastAnnouncedLabel = result.label;
  } else if (!input.value) {
    strengthLive.textContent = "";
    lastAnnouncedLabel = "";
  }

  characterClassesEl.innerHTML = Object.entries(result.characterClasses)
    .map(([key, present]) => {
      const cls = present ? "char-class-badge--present" : "char-class-badge--absent";
      const mark = present ? "✓" : "—";
      return `<li class="char-class-badge ${cls}">${mark} ${CLASS_LABELS[key]}</li>`;
    })
    .join("");

  crackTimeEl.textContent = input.value
    ? `About ${result.crackTime} for an offline attacker to guess, at a rough estimate.`
    : "Type a password above to see an estimate.";

  flagsListEl.innerHTML = result.flags.length
    ? result.flags
        .map(
          (flag) => `
        <li class="flag-card">
          <div class="flag-card-header">
            <span class="${SEVERITY_BADGE_CLASS[flag.severity]}">${SEVERITY_LABEL[flag.severity]}</span>
            <h3 class="flag-title">${escapeHtml(flag.title)}</h3>
          </div>
          <p class="flag-description">${escapeHtml(flag.description)}</p>
        </li>`
        )
        .join("")
    : input.value
      ? `<li class="flag-card">No common weaknesses detected by this tool. That doesn't guarantee it's uncrackable &mdash; length and true randomness still matter most.</li>`
      : "";
});

// --- Credential Reuse Check ---
const accountRowsEl = document.getElementById("account-rows");
const addAccountBtn = document.getElementById("add-account");
const toggleAllBtn = document.getElementById("toggle-all-passwords");
const reuseResultsEl = document.getElementById("reuse-results");
const reuseLive = document.getElementById("reuse-live");
const rowTemplate = document.getElementById("account-row-template");

const MAX_ROWS = 6;
let rowCounter = 0;
let passwordsVisible = false;

function updateRemoveButtons() {
  const rows = accountRowsEl.querySelectorAll("[data-row]");
  addAccountBtn.disabled = rows.length >= MAX_ROWS;
  rows.forEach((row) => {
    const removeBtn = row.querySelector("[data-remove-row]");
    removeBtn.disabled = rows.length <= 1;
  });
}

function addRow(label = "") {
  rowCounter += 1;
  const fragment = rowTemplate.content.cloneNode(true);
  const row = fragment.querySelector("[data-row]");
  row.dataset.rowId = String(rowCounter);

  const labelInput = row.querySelector('[data-field="label"]');
  const passwordInput = row.querySelector('[data-field="password"]');
  const removeBtn = row.querySelector("[data-remove-row]");

  labelInput.value = label;
  labelInput.id = `account-label-${rowCounter}`;
  passwordInput.id = `account-password-${rowCounter}`;
  passwordInput.type = passwordsVisible ? "text" : "password";

  labelInput.addEventListener("input", runReuseCheck);
  passwordInput.addEventListener("input", runReuseCheck);
  removeBtn.addEventListener("click", () => {
    row.remove();
    updateRemoveButtons();
    runReuseCheck();
    addAccountBtn.focus();
  });

  accountRowsEl.appendChild(row);
  updateRemoveButtons();
}

addAccountBtn.addEventListener("click", () => addRow());

toggleAllBtn.addEventListener("click", () => {
  passwordsVisible = !passwordsVisible;
  toggleAllBtn.textContent = passwordsVisible ? "Hide passwords" : "Show passwords";
  toggleAllBtn.setAttribute("aria-pressed", String(passwordsVisible));
  accountRowsEl.querySelectorAll('[data-field="password"]').forEach((el) => {
    el.type = passwordsVisible ? "text" : "password";
  });
});

function getAccounts() {
  return Array.from(accountRowsEl.querySelectorAll("[data-row]")).map((row) => ({
    id: row.dataset.rowId,
    label: row.querySelector('[data-field="label"]').value.trim(),
    password: row.querySelector('[data-field="password"]').value,
  }));
}

let lastReuseAnnouncement = "";

function runReuseCheck() {
  const accounts = getAccounts();
  const result = analyzeCredentialReuse(accounts);

  if (result.accountsWithPasswords > 0 && !isCompleted("tool-password-strength")) {
    markCompleted("tool-password-strength");
  }

  const labelFor = (account) => account.label || `Account ${account.id}`;

  const groupsHtml = [];

  result.exactReuseGroups.forEach((group) => {
    const names = group.map(labelFor).map(escapeHtml).join(", ");
    groupsHtml.push(`
      <div class="explanation-panel explanation-panel--incorrect">
        <p class="explanation-result explanation-result--incorrect">Exact same password reused: ${names}</p>
        <p class="explanation-text">
          If any one of these gets breached, an attacker's automated tools
          try that exact password against your other accounts within
          minutes. This is called credential stuffing, and it's how a
          single leaked site turns into many hacked accounts.
        </p>
      </div>`);
  });

  result.similarReuseGroups.forEach((group) => {
    const names = group.map(labelFor).map(escapeHtml).join(", ");
    groupsHtml.push(`
      <div class="explanation-panel explanation-panel--warning">
        <p class="explanation-result explanation-result--warning">Lightly-tweaked variations reused: ${names}</p>
        <p class="explanation-text">
          These passwords only differ by a number, symbol, or year at the
          end. Credential-stuffing tools automatically try exactly these
          kinds of small tweaks, so this offers much less protection than
          it feels like.
        </p>
      </div>`);
  });

  let statusHtml = "";
  if (result.accountsWithPasswords === 0) {
    statusHtml = `<p style="font-size: 0.875rem; color: var(--color-text-muted);">Add at least two accounts above to check for reuse.</p>`;
  } else if (result.accountsWithPasswords === 1) {
    statusHtml = `<p style="font-size: 0.875rem; color: var(--color-text-muted);">Add one more account to compare passwords.</p>`;
  } else if (!result.hasReuse) {
    statusHtml = `<div class="explanation-panel explanation-panel--correct">
      <p class="explanation-result explanation-result--correct">&#10003; No reuse detected between what you've entered.</p>
      <p class="explanation-text">
        This offline tool can only compare the passwords you typed against
        each other &mdash; it can't check real data-breach databases,
        since this site never sends anything over the network. A password
        manager that generates a unique password per site is still the
        most reliable way to guarantee this.
      </p>
    </div>`;
  }

  reuseResultsEl.innerHTML = groupsHtml.join("") + statusHtml;

  const groupCount = result.exactReuseGroups.length + result.similarReuseGroups.length;
  const announcement = result.hasReuse
    ? `Reuse detected across ${groupCount} group${groupCount === 1 ? "" : "s"} of accounts.`
    : result.accountsWithPasswords > 1
      ? "No reuse detected."
      : "";
  if (announcement && announcement !== lastReuseAnnouncement) {
    reuseLive.textContent = announcement;
    lastReuseAnnouncement = announcement;
  }
}

// Seed with two starter rows so the feature is immediately obvious
// without requiring the user to already know what to type.
addRow("Email");
addRow("Shopping");
runReuseCheck();
