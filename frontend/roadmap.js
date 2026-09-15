// Page script for the Roadmap. Ported from src/pages/roadmap/index.astro.
//
// Astro rendered the domain/level/item nesting at build time via .map()
// calls in the frontmatter, then a small <script> hydrated status dots and
// lock state on top of that pre-rendered HTML. There's no build step here,
// so both jobs collapse into one: this file builds the entire nested
// structure AND computes every item's status, in a single client-side pass.
// This is a genuinely new pattern in this rebuild — nothing ported so far
// has needed to render a list from data at runtime rather than writing the
// content directly into the page's HTML.

import { DOMAINS, LEVELS, CURRICULUM_ITEMS } from "./js/lib/curriculum.js";
import { isCompleted, getProgressSummary } from "./js/lib/progress-store.js";

const TYPE_LABEL = { simulation: "Simulation", quiz: "Quiz", tool: "Tool" };

const STATUS_DOT_CLASS = {
  completed: "status-dot status-dot--completed",
  ready: "status-dot status-dot--ready",
  locked: "status-dot status-dot--locked",
  unbuilt: "status-dot status-dot--unbuilt",
};

const STATUS_LABEL = {
  completed: "✓ Completed",
  locked: "Locked",
  unbuilt: "Coming soon",
  ready: "Ready",
};

function isLevelUnlocked(domainId, level) {
  if (level <= 1) return true;
  const priorAvailableItems = CURRICULUM_ITEMS.filter(
    (item) => item.domain === domainId && item.level < level && item.available
  );
  if (priorAvailableItems.length === 0) return true;
  return priorAvailableItems.every((item) => isCompleted(item.id));
}

function statusFor(item, unlocked) {
  if (!item.available) return "unbuilt";
  if (isCompleted(item.id)) return "completed";
  return unlocked ? "ready" : "locked";
}

function buildItemRow(item, status) {
  const li = document.createElement("li");
  li.className = "roadmap-item";

  const left = document.createElement("div");
  left.className = "roadmap-item-left";

  const dot = document.createElement("span");
  dot.className = STATUS_DOT_CLASS[status];
  dot.setAttribute("aria-hidden", "true");
  left.appendChild(dot);

  const link = document.createElement("a");
  link.className = "roadmap-item-link";
  link.textContent = item.title;
  if (status === "ready" || status === "completed") {
    link.href = item.href;
  } else {
    link.setAttribute("aria-disabled", "true");
  }
  left.appendChild(link);

  const badge = document.createElement("span");
  badge.className = "type-badge";
  badge.textContent = TYPE_LABEL[item.type];
  left.appendChild(badge);

  li.appendChild(left);

  const statusLabel = document.createElement("span");
  statusLabel.className = "roadmap-item-status";
  statusLabel.textContent = STATUS_LABEL[status];
  li.appendChild(statusLabel);

  return li;
}

function buildLevelGroup(domain, level, items) {
  const unlocked = isLevelUnlocked(domain.id, level.id);

  const group = document.createElement("div");
  group.className = "level-group";

  const heading = document.createElement("h3");
  heading.textContent = `Level ${level.id} — ${level.name}`;
  const desc = document.createElement("span");
  desc.className = "level-group-description";
  desc.textContent = level.description;
  heading.appendChild(desc);
  group.appendChild(heading);

  const list = document.createElement("ul");
  list.className = "roadmap-item-list";
  items.forEach((item) => {
    const status = statusFor(item, unlocked);
    list.appendChild(buildItemRow(item, status));
  });
  group.appendChild(list);

  return group;
}

function buildDomainSection(domain, domainItems) {
  const levelsInDomain = LEVELS.filter((lvl) => domainItems.some((i) => i.level === lvl.id));

  const section = document.createElement("div");
  section.className = "domain-section";

  const heading = document.createElement("h2");
  heading.textContent = domain.name;
  section.appendChild(heading);

  const desc = document.createElement("p");
  desc.className = "domain-section-description";
  desc.textContent = domain.description;
  section.appendChild(desc);

  levelsInDomain.forEach((level) => {
    const items = domainItems.filter((i) => i.level === level.id);
    section.appendChild(buildLevelGroup(domain, level, items));
  });

  return section;
}

function render() {
  const content = document.getElementById("roadmap-content");
  content.innerHTML = "";

  DOMAINS.forEach((domain) => {
    const domainItems = CURRICULUM_ITEMS.filter((i) => i.domain === domain.id);
    if (domainItems.length === 0) return;
    content.appendChild(buildDomainSection(domain, domainItems));
  });

  const summary = getProgressSummary(CURRICULUM_ITEMS.filter((i) => i.available));
  document.getElementById("overall-progress-text").textContent = `${summary.completed} / ${summary.total} complete`;
  document.getElementById("overall-progress-bar").style.width = `${summary.percent}%`;
}

render();
