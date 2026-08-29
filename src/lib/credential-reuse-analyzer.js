/**
 * Credential reuse / credential-stuffing heuristic analyzer.
 *
 * Pure, framework-free logic: takes a list of practice "accounts" (label +
 * password pairs typed by the user) and finds cases of exact password reuse
 * or lightly-tweaked reuse (same base word with a different trailing
 * number/symbol/year — the single most common real-world reuse pattern).
 *
 * This is a purely offline comparison of what the user typed against
 * itself. It intentionally does NOT check real breach databases — this
 * site makes no network calls, so it never could, and claiming otherwise
 * would be dishonest. See the UI copy for how that limitation is disclosed.
 */

/** @typedef {{ id: string, label: string, password: string }} Account */

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

// Strips a trailing run of digits/symbols (the "Password1" -> "Password2024"
// -> "Password2025!" style tweak) so those variants group together as the
// same underlying base password.
function baseify(password) {
  return password.toLowerCase().replace(/[\d!@#$%^&*()_+\-=.]+$/, "");
}

/**
 * @param {Account[]} accounts
 * @returns {{
 *   accountsWithPasswords: number,
 *   exactReuseGroups: Account[][],
 *   similarReuseGroups: Account[][],
 *   hasReuse: boolean,
 * }}
 */
export function analyzeCredentialReuse(accounts) {
  const withPasswords = accounts.filter((account) => account.password.trim().length > 0);

  const exactMap = groupBy(withPasswords, (account) => account.password);
  const exactReuseGroups = [...exactMap.values()].filter((group) => group.length > 1);

  const inExactGroup = new Set(exactReuseGroups.flat().map((account) => account.id));
  const remaining = withPasswords.filter((account) => !inExactGroup.has(account.id));

  const baseMap = groupBy(remaining, (account) => baseify(account.password));
  const similarReuseGroups = [...baseMap.entries()]
    .filter(([base, group]) => base.length >= 4 && group.length > 1)
    .map(([, group]) => group);

  return {
    accountsWithPasswords: withPasswords.length,
    exactReuseGroups,
    similarReuseGroups,
    hasReuse: exactReuseGroups.length > 0 || similarReuseGroups.length > 0,
  };
}
