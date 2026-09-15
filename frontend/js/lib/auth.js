/**
 * Client for the backend's optional accounts + server-side progress
 * tracking (backend/app.py's /api/auth/* and /api/progress routes).
 *
 * Logging in is entirely optional -- every simulation/quiz/tool still
 * works, and still tracks progress locally via progress-store.js, whether
 * or not anyone is logged in. This module is what progress-store.js
 * additionally calls into when a visitor IS logged in, and what nav.js
 * uses to show the current login state and the login/register link.
 */

// TODO: update once the backend is deployed somewhere reachable from the
// live Netlify site (still running only on localhost as of this writing
// -- see PLAN.md).
const BACKEND_URL = "http://localhost:5000";

let cachedUser = null;
let readyPromise = null;

async function apiFetch(path, options = {}) {
  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    // Sends/receives the session cookie even though the frontend and
    // backend are different origins -- see app.py's CORS/cookie config
    // comments for the other half of this.
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
}

/**
 * Checks login state once per page load and caches the result, so
 * repeated calls (e.g. from progress-store.js on every markCompleted)
 * don't each make their own network request. Call this once, early, on
 * every page -- nav.js does this already.
 */
export function initAuthState() {
  if (!readyPromise) {
    // /api/auth/me is always a 200 (see app.py's comment on that route) --
    // "not logged in" is a normal result here, not an error response, on
    // purpose, so this never trips a console error for the common case.
    readyPromise = apiFetch("/api/auth/me")
      .then((response) => response.json())
      .then((user) => {
        cachedUser = user;
        return user;
      })
      .catch(() => {
        cachedUser = null;
        return null;
      });
  }
  return readyPromise;
}

/** Synchronous read of the cached login state (null until initAuthState()
 * has resolved at least once on this page, and null if logged out). */
export function getCachedUser() {
  return cachedUser;
}

export async function register(username, password) {
  const response = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Registration failed");
  cachedUser = data;
  return data;
}

export async function login(username, password) {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Login failed");
  cachedUser = data;
  return data;
}

export async function logout() {
  await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  cachedUser = null;
}

export async function fetchServerProgress() {
  const response = await apiFetch("/api/progress");
  if (!response.ok) return [];
  return response.json();
}

/** Fire-and-forget by design -- localStorage (progress-store.js) is
 * still the source of truth for the current page's own render either
 * way, so a failed or slow server sync should never block or break
 * anything visible to the person using the page right now. */
export function pushProgress(itemId, meta = {}) {
  apiFetch("/api/progress", {
    method: "POST",
    body: JSON.stringify({ itemId, score: meta.score, total: meta.total }),
  }).catch(() => {});
}

export function resetServerProgress() {
  return apiFetch("/api/progress", { method: "DELETE" }).catch(() => {});
}
