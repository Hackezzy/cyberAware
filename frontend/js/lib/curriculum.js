/**
 * The curriculum: the single source of truth for how every simulation,
 * quiz, and tool is organized — by cybersecurity domain and by difficulty
 * level. The Roadmap and My Progress pages both read from this file rather
 * than hand-listing items separately.
 *
 * Ported from src/data/curriculum.js. This is NOT a byte-identical copy —
 * every `href` has been rewritten from Astro's route paths (e.g.
 * "/simulations/phishing") to this rebuild's flat-file paths (e.g.
 * "/simulations/phishing.html"), since the two builds use completely
 * different URL schemes. These hrefs are root-relative to frontend/ itself
 * (frontend/ is the deployed site root — see netlify.toml — not a
 * subdirectory reachable at /). Every item below is `available: true`
 * because, as of this port, all 8 simulations, all 11 quizzes, and all 4
 * tools are live in frontend/ — the Astro version's per-item `available`
 * flag doesn't need to vary here the way it briefly did while this rebuild
 * was still in progress page-by-page.
 *
 * Level and domain assignments are informed by SIMULATION-SCOPE-RESEARCH.md
 * (project root) — see that file for the cited evidence behind the scope.
 */

export const DOMAINS = [
  {
    id: "email",
    name: "Email & Message Security",
    description:
      "Phishing and its variants — the most common way real attacks begin.",
  },
  {
    id: "social",
    name: "Human & Social Engineering",
    description:
      "Attacks that work by manipulating a person directly, not a system.",
  },
  {
    id: "network",
    name: "Network & Wireless Security",
    description: "Attacks that intercept or redirect traffic you send.",
  },
  {
    id: "malware",
    name: "Malware & Ransomware",
    description: "How malicious software gets in, spreads, and does damage.",
  },
  {
    id: "identity",
    name: "Identity & Access",
    description: "Passwords, credentials, and authentication weaknesses.",
  },
];

export const LEVELS = [
  {
    id: 1,
    name: "Novice",
    description:
      "Clear, single red flags with room to learn the basic pattern.",
  },
  {
    id: 2,
    name: "Apprentice",
    description:
      "Multiple, more subtle signals — closer to a realistic attempt.",
  },
  {
    id: 3,
    name: "Practitioner",
    description:
      "Ambiguous, realistic scenarios that mix legitimate and malicious signals — the kind of judgment call an entry-level analyst actually makes.",
  },
  {
    id: 4,
    name: "Advanced",
    description:
      "Multi-stage or organizational-level scenarios requiring you to reason about risk, not just spot one obvious tell.",
  },
  {
    id: 5,
    name: "Stress Test",
    description:
      "Chained, adversarial, time-pressured scenarios designed to catch even careful reasoning off guard. Reserved for future capstone content.",
  },
];

/**
 * @typedef {Object} CurriculumItem
 * @property {string} id - stable id, used as the progress-tracking key
 * @property {"simulation"|"quiz"|"tool"} type
 * @property {string} domain - a DOMAINS id
 * @property {number} level - a LEVELS id
 * @property {string} title
 * @property {string} description - one sentence, shown on hub pages
 * @property {string} href
 * @property {boolean} available
 */

/** @type {CurriculumItem[]} */
export const CURRICULUM_ITEMS = [
  // --- Email & Message Security ---
  { id: "sim-phishing", type: "simulation", domain: "email", level: 1, title: "Phishing", description: "Watch how a phishing email unfolds step by step, from the fake domain to the stolen password.", href: "/simulations/phishing.html", available: true },
  { id: "tool-phishing-scanner", type: "tool", domain: "email", level: 1, title: "Phishing Email Scanner", description: "Paste or load a sample email and see exactly which red flags gave it away.", href: "/tools/phishing-scanner.html", available: true },
  { id: "quiz-phishing", type: "quiz", domain: "email", level: 1, title: "Phishing Quiz", description: "Test what you've learned about spotting a phishing attempt.", href: "/quizzes/phishing.html", available: true },
  { id: "sim-smishing", type: "simulation", domain: "email", level: 2, title: "Smishing", description: "SMS phishing — the text-message version of the scam.", href: "/simulations/smishing.html", available: true },
  { id: "quiz-smishing", type: "quiz", domain: "email", level: 2, title: "Smishing Quiz", description: "Test what you've learned about SMS phishing red flags.", href: "/quizzes/smishing.html", available: true },
  { id: "sim-vishing", type: "simulation", domain: "email", level: 3, title: "Vishing", description: "A phone call that uses urgency and a spoofed caller ID to extract information.", href: "/simulations/vishing.html", available: true },
  { id: "quiz-vishing", type: "quiz", domain: "email", level: 3, title: "Vishing Quiz", description: "Test what you've learned about voice-phishing calls.", href: "/quizzes/vishing.html", available: true },
  { id: "sim-bec", type: "simulation", domain: "email", level: 3, title: "Business Email Compromise", description: "CEO/invoice fraud aimed at small businesses.", href: "/simulations/business-email-compromise.html", available: true },
  { id: "quiz-bec", type: "quiz", domain: "email", level: 3, title: "Business Email Compromise Quiz", description: "Test what you've learned about CEO/invoice fraud.", href: "/quizzes/business-email-compromise.html", available: true },

  // --- Human & Social Engineering ---
  { id: "sim-tailgating", type: "simulation", domain: "social", level: 1, title: "Tailgating", description: "Physically following someone through a secure door without their own badge.", href: "/simulations/tailgating.html", available: true },
  { id: "quiz-tailgating", type: "quiz", domain: "social", level: 1, title: "Tailgating Quiz", description: "Test what you've learned about physical tailgating.", href: "/quizzes/tailgating.html", available: true },
  { id: "sim-baiting", type: "simulation", domain: "social", level: 2, title: "Baiting", description: "A tempting USB drive or \"free download\" that quietly delivers malware.", href: "/simulations/baiting.html", available: true },
  { id: "quiz-baiting", type: "quiz", domain: "social", level: 2, title: "Baiting Quiz", description: "Test what you've learned about baiting and planted devices.", href: "/quizzes/baiting.html", available: true },
  { id: "quiz-pretexting", type: "quiz", domain: "social", level: 3, title: "Pretexting Quiz", description: "Spot a manufactured backstory before it earns your trust.", href: "/quizzes/pretexting.html", available: true },

  // --- Network & Wireless Security ---
  { id: "sim-fake-wifi", type: "simulation", domain: "network", level: 2, title: "Fake Wi-Fi", description: "How a rogue hotspot can intercept everything you send.", href: "/simulations/fake-wifi.html", available: true },
  { id: "quiz-fake-wifi", type: "quiz", domain: "network", level: 2, title: "Fake Wi-Fi Quiz", description: "Spotting a rogue hotspot before it's too late.", href: "/quizzes/fake-wifi.html", available: true },
  { id: "tool-url-checker", type: "tool", domain: "network", level: 1, title: "URL Safety Checker", description: "Breaks down a URL's structure and flags suspicious patterns.", href: "/tools/url-checker.html", available: true },

  // --- Malware & Ransomware ---
  { id: "sim-ransomware", type: "simulation", domain: "malware", level: 2, title: "Ransomware", description: "How ransomware spreads through a system and locks users out.", href: "/simulations/ransomware.html", available: true },
  { id: "quiz-ransomware", type: "quiz", domain: "malware", level: 2, title: "Ransomware Quiz", description: "How ransomware spreads, and how to avoid it.", href: "/quizzes/ransomware.html", available: true },

  // --- Identity & Access ---
  { id: "tool-password-strength", type: "tool", domain: "identity", level: 1, title: "Password Strength Analyzer", description: "Analyzes a password locally and explains its weaknesses.", href: "/tools/password-strength.html", available: true },
  { id: "quiz-credential-reuse", type: "quiz", domain: "identity", level: 2, title: "Credential Reuse Quiz", description: "Test what you know about password reuse and credential-stuffing risk.", href: "/quizzes/credential-reuse.html", available: true },
  { id: "tool-mfa-simulator", type: "tool", domain: "identity", level: 3, title: "MFA Simulator", description: "Demonstrates MFA methods and how each can be attacked.", href: "/tools/mfa-simulator.html", available: true },

  // --- Cross-domain / organizational ---
  { id: "quiz-third-party-risk", type: "quiz", domain: "social", level: 4, title: "Third-Party Risk Quiz", description: "Vendor and supply-chain scenarios for small businesses.", href: "/quizzes/third-party-risk.html", available: true },
];

export function itemsByDomain(domainId) {
  return CURRICULUM_ITEMS.filter((item) => item.domain === domainId);
}

export function itemsByLevel(level) {
  return CURRICULUM_ITEMS.filter((item) => item.level === level);
}

export function itemsByType(type) {
  return CURRICULUM_ITEMS.filter((item) => item.type === type);
}
