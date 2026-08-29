/**
 * Password strength heuristic analyzer.
 *
 * Pure, framework-free logic: takes a plain password string and returns a
 * strength score plus a list of specific weaknesses with explanations.
 * No DOM access, no network calls, no logging of the password itself.
 */

/** @typedef {{ id: string, severity: "high"|"medium"|"low", title: string, description: string }} Flag */

// A small sample of the most common leaked/guessed passwords. Real attackers
// use lists with millions of entries — this is enough to teach the concept.
const COMMON_PASSWORDS = new Set(
  [
    "123456", "123456789", "12345678", "12345", "1234567", "password",
    "qwerty", "qwerty123", "111111", "123123", "abc123", "password1",
    "iloveyou", "1q2w3e4r", "000000", "letmein", "welcome", "monkey",
    "dragon", "football", "baseball", "master", "superman", "trustno1",
    "sunshine", "princess", "admin", "login", "starwars", "shadow",
    "michael", "jennifer", "jordan", "hunter", "asdfgh", "zxcvbn",
    "passw0rd", "p@ssword", "p@ssw0rd", "changeme", "whatever",
    "freedom", "whatever1", "qazwsx", "1qaz2wsx", "121212", "654321",
  ].map((p) => p.toLowerCase())
);

// Base words that commonly get "strengthened" with numbers/symbols
// (e.g. "Password1!") while remaining trivially guessable.
const WEAK_BASE_WORDS = [
  "password", "welcome", "admin", "letmein", "monkey", "dragon",
  "football", "baseball", "iloveyou", "sunshine", "princess", "qwerty",
  "master", "shadow", "superman", "trustno1", "starwars", "freedom",
  "login", "hunter", "michael", "jennifer", "jordan", "abc",
];

const KEYBOARD_WALKS = [
  "qwerty", "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbn", "zxcvbnm",
  "1qaz2wsx", "qazwsx", "1q2w3e4r", "poiuyt", "mnbvcx",
];

function normalizeLeetspeak(value) {
  return value
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[7]/g, "t");
}

function hasSequentialRun(password, minLength = 4) {
  const lower = password.toLowerCase();
  for (let i = 0; i <= lower.length - minLength; i++) {
    let ascending = true;
    let descending = true;
    for (let j = 1; j < minLength; j++) {
      const diff = lower.charCodeAt(i + j) - lower.charCodeAt(i + j - 1);
      if (diff !== 1) ascending = false;
      if (diff !== -1) descending = false;
    }
    if (ascending || descending) return lower.slice(i, i + minLength);
  }
  return null;
}

function hasRepeatedRun(password, minLength = 3) {
  for (let i = 0; i <= password.length - minLength; i++) {
    const char = password[i];
    let allSame = true;
    for (let j = 1; j < minLength; j++) {
      if (password[i + j] !== char) {
        allSame = false;
        break;
      }
    }
    if (allSame) return char.repeat(minLength);
  }
  return null;
}

function findKeyboardWalk(password) {
  const lower = password.toLowerCase();
  return KEYBOARD_WALKS.find((walk) => lower.includes(walk)) ?? null;
}

function findWeakBaseWord(password) {
  const normalized = normalizeLeetspeak(password);
  return WEAK_BASE_WORDS.find((word) => normalized.includes(word)) ?? null;
}

/**
 * Rough offline-attack crack time estimate, for teaching purposes only.
 * Assumes 10 billion guesses/second (a realistic fast offline GPU attack)
 * and a search space of charsetSize^length.
 */
function estimateCrackTime(password, charsetSize) {
  const guessesPerSecond = 10_000_000_000;
  const combinations = Math.pow(charsetSize, password.length);
  const seconds = combinations / guessesPerSecond / 2; // average case, not worst case

  const pluralize = (value, unit) => `${value} ${unit}${value === 1 ? "" : "s"}`;

  if (!Number.isFinite(seconds) || seconds < 1) return "instantly";
  if (seconds < 60) return "seconds";
  if (seconds < 3600) return pluralize(Math.round(seconds / 60), "minute");
  if (seconds < 86400) return pluralize(Math.round(seconds / 3600), "hour");
  if (seconds < 31536000) return pluralize(Math.round(seconds / 86400), "day");
  const years = seconds / 31536000;
  if (years < 1000) return pluralize(Math.round(years), "year");
  if (years < 1_000_000) return `${Math.round(years / 1000)} thousand years`;
  return "centuries";
}

const STRENGTH_TIERS = [
  { min: 0, level: "very-weak", label: "Very Weak" },
  { min: 20, level: "weak", label: "Weak" },
  { min: 40, level: "fair", label: "Fair" },
  { min: 60, level: "strong", label: "Strong" },
  { min: 80, level: "very-strong", label: "Very Strong" },
];

function strengthForScore(score) {
  return [...STRENGTH_TIERS].reverse().find((tier) => score >= tier.min);
}

/**
 * Analyze a password string for strength and specific weaknesses.
 * @param {string} password
 * @returns {{
 *   score: number,
 *   level: string,
 *   label: string,
 *   crackTime: string,
 *   flags: Flag[],
 *   characterClasses: { lower: boolean, upper: boolean, digit: boolean, symbol: boolean }
 * }}
 */
export function analyzePassword(password) {
  if (!password) {
    return {
      score: 0,
      level: "very-weak",
      label: "Very Weak",
      crackTime: "instantly",
      flags: [],
      characterClasses: { lower: false, upper: false, digit: false, symbol: false },
    };
  }

  const characterClasses = {
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
    symbol: /[^a-zA-Z0-9]/.test(password),
  };
  const classCount = Object.values(characterClasses).filter(Boolean).length;

  /** @type {Flag[]} */
  const flags = [];

  const isCommonPassword = COMMON_PASSWORDS.has(password.toLowerCase());
  const isAllDigits = /^\d+$/.test(password);
  const sequentialRun = hasSequentialRun(password);
  const repeatedRun = hasRepeatedRun(password);
  const keyboardWalk = findKeyboardWalk(password);
  const weakBaseWord = findWeakBaseWord(password);

  if (password.length < 8) {
    flags.push({
      id: "too-short",
      severity: "high",
      title: "Too short",
      description:
        "Passwords under 8 characters can be brute-forced quickly no matter how varied the characters are.",
    });
  }

  if (isCommonPassword) {
    flags.push({
      id: "common-password",
      severity: "high",
      title: "One of the most commonly used passwords",
      description:
        "This exact password appears in lists attackers already try first — it would be guessed almost instantly, regardless of length.",
    });
  }

  if (isAllDigits && password.length > 0) {
    flags.push({
      id: "all-digits",
      severity: "high",
      title: "Only contains digits",
      description:
        "A number-only password (like a PIN) has a far smaller search space than one mixing letters, numbers, and symbols.",
    });
  }

  if (weakBaseWord && !isCommonPassword) {
    flags.push({
      id: "weak-base-word",
      severity: "high",
      title: "Based on a common word or predictable pattern",
      description: `Swapping letters for lookalike symbols (like "a" → "@" or "o" → "0") doesn't hide a predictable base word — attacker tools already check for "${weakBaseWord}" and its common variations.`,
    });
  }

  if (keyboardWalk) {
    flags.push({
      id: "keyboard-walk",
      severity: "medium",
      title: "Contains a keyboard pattern",
      description: `"${keyboardWalk}" follows the physical layout of a keyboard, which makes it one of the first patterns attackers try.`,
    });
  }

  if (sequentialRun) {
    flags.push({
      id: "sequential-characters",
      severity: "medium",
      title: "Contains sequential characters",
      description: `"${sequentialRun}" is a predictable increasing or decreasing sequence.`,
    });
  }

  if (repeatedRun) {
    flags.push({
      id: "repeated-characters",
      severity: "medium",
      title: "Contains repeated characters",
      description: `"${repeatedRun}" repeats the same character, which reduces how random the password actually is.`,
    });
  }

  if (classCount <= 1 && password.length > 0 && !isAllDigits) {
    flags.push({
      id: "single-character-class",
      severity: "medium",
      title: "Uses only one type of character",
      description:
        "Mixing uppercase, lowercase, numbers, and symbols multiplies the number of guesses an attacker has to try.",
    });
  }

  // Scoring: length is the strongest factor, with a bonus for character
  // variety, then penalties for predictable patterns.
  let score = Math.min(password.length, 20) * 4;
  score += Math.max(0, classCount - 1) * 10;

  if (isCommonPassword) score = Math.min(score, 5);
  if (isAllDigits) score = Math.min(score, 20);
  if (weakBaseWord) score -= 25;
  if (keyboardWalk) score -= 20;
  if (sequentialRun) score -= 15;
  if (repeatedRun) score -= 15;
  if (password.length < 8) score = Math.min(score, 25);

  score = Math.max(0, Math.min(100, Math.round(score)));

  const tier = strengthForScore(score);
  const charsetSize =
    (characterClasses.lower ? 26 : 0) +
    (characterClasses.upper ? 26 : 0) +
    (characterClasses.digit ? 10 : 0) +
    (characterClasses.symbol ? 32 : 0) || 1;

  // Real-world cracking tools run dictionary + mutation-rule attacks before
  // falling back to brute force, so a keyboard walk or a disguised common
  // word is guessed almost immediately — showing a brute-force time estimate
  // for those would understate the risk and imply false security.
  let crackTime;
  if (isCommonPassword) {
    crackTime = "instantly (it's a known common password)";
  } else if (keyboardWalk || weakBaseWord) {
    crackTime = "seconds to minutes (it follows a well-known pattern)";
  } else {
    crackTime = estimateCrackTime(password, charsetSize);
  }

  return {
    score,
    level: tier.level,
    label: tier.label,
    crackTime,
    flags,
    characterClasses,
  };
}
