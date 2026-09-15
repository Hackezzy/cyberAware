/**
 * Local-storage progress tracking, with an optional account-backed sync
 * layered on top.
 *
 * Every visitor's progress lives in their own browser's local storage,
 * whether or not they're logged in -- that part of the design hasn't
 * changed. What's new: if a visitor IS logged in (see auth.js), completing
 * something also gets pushed to the backend's real database under their
 * account, and logging in on a page pulls down anything already recorded
 * there. Local storage stays the thing every page actually reads from
 * (Roadmap, My Progress, the "is this done" checks) -- the server is a
 * second copy that follows it, not a replacement read path, so nothing
 * downstream needed to change to support this.
 */

import { getCachedUser, pushProgress, fetchServerProgress, resetServerProgress } from "./auth.js";

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

  const user = getCachedUser();
  if (user) pushProgress(itemId, meta);
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
  const user = getCachedUser();
  if (user) resetServerProgress();
}

/**
 * Two-way sync with the account-backed record, called once right after a
 * visitor is known to be logged in (nav.js does this after initAuthState()
 * resolves, and login.js does it right after a successful login/register).
 * Pulls down anything the server has that this browser doesn't (e.g. a
 * fresh browser/device), then pushes up anything this browser has that
 * the server doesn't (e.g. progress made before logging in) -- never
 * overwrites an existing record in either direction, so a better score
 * from elsewhere is never clobbered by an older local one.
 */
export async function syncWithServerIfLoggedIn() {
  const user = getCachedUser();
  if (!user) return;

  const serverRows = await fetchServerProgress();
  const store = readStore();

  for (const row of serverRows) {
    if (store.completed[row.item_id]) continue;
    store.completed[row.item_id] = {
      completedAt: row.completed_at,
      ...(row.score != null ? { score: row.score, total: row.total } : {}),
    };
  }
  writeStore(store);

  const serverIds = new Set(serverRows.map((row) => row.item_id));
  for (const [itemId, meta] of Object.entries(store.completed)) {
    if (!serverIds.has(itemId)) pushProgress(itemId, meta);
  }
}
