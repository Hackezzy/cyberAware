// Page script for My Progress. Ported from src/pages/progress/index.astro.
//
// Same collapse-build-time-and-hydration-into-one-pass situation as
// roadmap.js: the domain cards and activity log were originally partly
// pre-rendered by Astro (empty skeletons with 0/0 placeholders) and then
// filled in by a hydration script. Here the skeleton domain cards are also
// built client-side, since there's no build step to pre-render them.

import { DOMAINS, CURRICULUM_ITEMS } from "./js/lib/curriculum.js";
import { getCompletedIds, getCompletionMeta, getProgressSummary, resetProgress } from "./js/lib/progress-store.js";

const TYPE_LABEL = { simulation: "Simulation", quiz: "Quiz", tool: "Tool" };
const DOMAIN_NAME = Object.fromEntries(DOMAINS.map((d) => [d.id, d.name]));

const availableItems = CURRICULUM_ITEMS.filter((item) => item.available);
const itemsById = new Map(availableItems.map((item) => [item.id, item]));
const domainsWithItems = DOMAINS.filter((domain) => availableItems.some((item) => item.domain === domain.id));

const emptyState = document.getElementById("empty-state");
const progressContent = document.getElementById("progress-content");
const overallText = document.getElementById("overall-progress-text");
const overallBar = document.getElementById("overall-progress-bar");
const domainCardsEl = document.getElementById("domain-cards");
const activityLog = document.getElementById("activity-log");
const resetBtn = document.getElementById("reset-progress");

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function buildDomainCards() {
  domainCardsEl.innerHTML = "";
  domainsWithItems.forEach((domain) => {
    const row = document.createElement("div");
    row.className = "domain-progress-row";
    row.dataset.domainCard = domain.id;
    row.innerHTML = `
      <div class="domain-progress-header">
        <span>${domain.name}</span>
        <span data-domain-count>0 / 0</span>
      </div>
      <div class="domain-progress-track">
        <div data-domain-bar class="domain-progress-fill" style="width: 0%"></div>
      </div>
    `;
    domainCardsEl.appendChild(row);
  });
}

function render() {
  const completedIds = getCompletedIds().filter((id) => itemsById.has(id));

  if (completedIds.length === 0) {
    emptyState.hidden = false;
    progressContent.hidden = true;
    return;
  }
  emptyState.hidden = true;
  progressContent.hidden = false;

  const summary = getProgressSummary(availableItems);
  overallText.textContent = `${summary.completed} / ${summary.total} complete`;
  overallBar.style.width = `${summary.percent}%`;

  ["simulation", "tool", "quiz"].forEach((type) => {
    const card = document.querySelector(`[data-type-card="${type}"]`);
    if (!card) return;
    const typeItems = availableItems.filter((item) => item.type === type);
    const typeSummary = getProgressSummary(typeItems);
    card.querySelector("[data-type-count]").textContent = `${typeSummary.completed} / ${typeSummary.total}`;
  });

  document.querySelectorAll("[data-domain-card]").forEach((card) => {
    const domainId = card.getAttribute("data-domain-card");
    const domainItems = availableItems.filter((item) => item.domain === domainId);
    const domainSummary = getProgressSummary(domainItems);
    card.querySelector("[data-domain-count]").textContent = `${domainSummary.completed} / ${domainSummary.total}`;
    const barEl = card.querySelector("[data-domain-bar]");
    barEl.style.width = `${domainSummary.percent}%`;
    barEl.classList.toggle("domain-progress-fill--complete", domainSummary.percent === 100);
  });

  const entries = completedIds
    .map((id) => ({ item: itemsById.get(id), meta: getCompletionMeta(id) }))
    .filter((entry) => entry.meta)
    .sort((a, b) => new Date(b.meta.completedAt).getTime() - new Date(a.meta.completedAt).getTime());

  activityLog.innerHTML = entries
    .map(({ item, meta }) => {
      const scoreText =
        typeof meta.score === "number" && typeof meta.total === "number"
          ? `<span>&middot; Score: ${meta.score}/${meta.total}</span>`
          : "";
      return `
      <li class="activity-item">
        <div class="activity-item-left">
          <a href="${item.href}" class="activity-item-title">${item.title}</a>
          <span class="type-badge">${TYPE_LABEL[item.type]}</span>
          <span style="font-size: 0.75rem; color: var(--color-text-muted);">${DOMAIN_NAME[item.domain] ?? ""}</span>
        </div>
        <div class="activity-item-right">
          ${scoreText}
          <span>${formatDate(meta.completedAt)}</span>
        </div>
      </li>`;
    })
    .join("");
}

resetBtn.addEventListener("click", () => {
  const confirmed = window.confirm(
    "Reset all progress on this device? This clears every completed simulation, tool, and quiz recorded in this browser. This can't be undone."
  );
  if (!confirmed) return;
  resetProgress();
  render();
});

buildDomainCards();
render();
