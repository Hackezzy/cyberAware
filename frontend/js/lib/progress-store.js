/**
 * Minimal local-storage progress tracking.
 *
 * This is the foundation the Roadmap page uses now, and the full "My
 * Progress" page (Build Order step 26) will build on top of — same
 * storage schema, so nothing gets migrated later. No accounts, no
 * backend, no network calls: everything lives in the visitor's own
 * browser and is only ever read back for them.
 */

const STORAGE_KEY = "cyberaware:progress:v1";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && parsed.completed
      ? parsed
      : { completed: {} };
  } catch {
    // Private browsing, storage disabled, quota exceeded, or corrupted JSON —
    // fail soft. Progress simply won't persist for this visitor.
    return { completed: {} };
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Same as above — nothing to do if storage isn't available.
  }
}

/**
 * @param {string} itemId - a CURRICULUM_ITEMS id from src/data/curriculum.js
 * @param {Record<string, unknown>} [meta] - optional extra info (e.g. a quiz score)
 */
export function markCompleted(itemId, meta = {}) {
  const store = readStore();
  store.completed[itemId] = { completedAt: new Date().toISOString(), ...meta };
  writeStore(store);
}

/** @param {string} itemId */
export function isCompleted(itemId) {
  return Boolean(readStore().completed[itemId]);
}

export function getCompletedIds() {
  return Object.keys(readStore().completed);
}

/** @param {string} itemId */
export function getCompletionMeta(itemId) {
  return readStore().completed[itemId] ?? null;
}

/**
 * @param {{ id: string }[]} items
 * @returns {{ total: number, completed: number, percent: number }}
 */
export function getProgressSummary(items) {
  const completedIds = new Set(getCompletedIds());
  const total = items.length;
  const completed = items.filter((item) => completedIds.has(item.id)).length;
  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
}

export function resetProgress() {
  writeStore({ completed: {} });
}
