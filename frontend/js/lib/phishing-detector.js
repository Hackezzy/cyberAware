/**
 * Phishing email heuristic analyzer.
 *
 * Pure, framework-free detection logic: takes a plain email object and
 * returns a risk score plus a list of flagged red flags with explanations.
 * No DOM access, no side effects — safe to unit test and reuse (e.g. from
 * a quiz question) independently of the scanner UI.
 */

/** @typedef {{ name: string, email: string }} EmailParty */
/**
 * @typedef {Object} PhishingEmail
 * @property {EmailParty} from
 * @property {string} [replyTo]
 * @property {string} subject
 * @property {string} body
 */

/**
 * @typedef {Object} Flag
 * @property {string} id
 * @property {"high"|"medium"|"low"} severity
 * @property {string} title
 * @property {string} description
 * @property {string} [evidence]
 */

const SEVERITY_WEIGHT = { high: 30, medium: 15, low: 6 };

// Brands commonly impersonated in phishing, mapped to their real domains.
// Keyword matching is intentionally simple (substring, case-insensitive) —
// this is a teaching heuristic, not a production threat-intel feed.
const KNOWN_BRANDS = {
  paypal: ["paypal.com"],
  microsoft: ["microsoft.com", "live.com", "outlook.com", "office.com"],
  apple: ["apple.com", "icloud.com"],
  amazon: ["amazon.com"],
  google: ["google.com", "gmail.com"],
  netflix: ["netflix.com"],
  "bank of america": ["bankofamerica.com"],
  "wells fargo": ["wellsfargo.com"],
  chase: ["chase.com"],
  dhl: ["dhl.com"],
  fedex: ["fedex.com"],
  usps: ["usps.com"],
};

// Display casing for brand names in flag descriptions, since KNOWN_BRANDS keys
// are lowercase for matching purposes (e.g. "paypal" -> "PayPal").
const BRAND_DISPLAY_NAMES = {
  paypal: "PayPal",
  microsoft: "Microsoft",
  apple: "Apple",
  amazon: "Amazon",
  google: "Google",
  netflix: "Netflix",
  "bank of america": "Bank of America",
  "wells fargo": "Wells Fargo",
  chase: "Chase",
  dhl: "DHL",
  fedex: "FedEx",
  usps: "USPS",
};

const URGENCY_PHRASES = [
  "act now",
  "act immediately",
  "urgent",
  "verify your account",
  "confirm your identity",
  "suspended",
  "unusual activity",
  "unauthorized access",
  "within 24 hours",
  "within 48 hours",
  "immediate action required",
  "your account will be",
  "failure to",
  "final notice",
  "avoid suspension",
  "click here immediately",
];

const CREDENTIAL_PHRASES = [
  "verify your password",
  "confirm your password",
  "enter your password",
  "social security number",
  "confirm your card",
  "card number",
  "cvv",
  "login credentials",
  "confirm your pin",
  "one-time code",
  "verification code",
  "update your billing",
];

const GENERIC_GREETINGS = [
  /^dear (customer|user|valued customer|sir\/?madam|member|client)/i,
  /^hello (customer|user|valued customer|member)/i,
];

const SHORTENER_DOMAINS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
];

const SUSPICIOUS_ATTACHMENT_MENTION = /\b[\w-]+\.(exe|scr|zip|js|jar|bat|vbs)\b/gi;

const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/g;
const BARE_URL = /\bhttps?:\/\/[^\s)]+/gi;

/** Small Levenshtein distance for catching lookalike domains (e.g. paypa1.com). */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function extractDomain(emailOrUrl) {
  if (!emailOrUrl) return null;
  if (emailOrUrl.includes("@")) {
    return emailOrUrl.split("@").pop()?.toLowerCase().trim() ?? null;
  }
  try {
    const withProtocol = /^[a-z]+:\/\//i.test(emailOrUrl)
      ? emailOrUrl
      : `http://${emailOrUrl}`;
    return new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function registrableLabel(domain) {
  // crude second-level-label extraction, good enough for teaching heuristics
  const parts = domain.split(".");
  return parts.length >= 2 ? parts[parts.length - 2] : domain;
}

function isIpAddressHost(host) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
}

function findMentionedBrand(text) {
  const lower = text.toLowerCase();
  for (const brand of Object.keys(KNOWN_BRANDS)) {
    if (lower.includes(brand)) return brand;
  }
  return null;
}

function domainMatchesBrand(domain, brand) {
  if (!domain) return false;
  const legitDomains = KNOWN_BRANDS[brand];
  return legitDomains.some((d) => domain === d || domain.endsWith(`.${d}`));
}

function isLookalikeOfBrand(domain, brand) {
  if (!domain) return false;
  const label = registrableLabel(domain);
  const distance = levenshtein(label, brand.replace(/\s+/g, ""));
  return distance > 0 && distance <= 2 && label.length >= brand.length - 2;
}

/** @param {PhishingEmail} email */
function checkSenderBrandSpoofing(email) {
  const senderDomain = extractDomain(email.from?.email);
  const mentionedInName = findMentionedBrand(email.from?.name || "");
  const mentionedInSubject = findMentionedBrand(email.subject || "");
  const brand = mentionedInName || mentionedInSubject;
  if (!brand || !senderDomain) return null;

  if (domainMatchesBrand(senderDomain, brand)) return null;

  const displayBrand = BRAND_DISPLAY_NAMES[brand] ?? brand;

  if (isLookalikeOfBrand(senderDomain, brand)) {
    return {
      id: "sender-lookalike-domain",
      severity: "high",
      title: "Sender domain looks like a spoofed brand domain",
      description: `The sender claims to be "${email.from.name}" (${displayBrand}), but the domain "${senderDomain}" is a lookalike of the real ${displayBrand} domain, not the real thing.`,
      evidence: email.from.email,
    };
  }

  return {
    id: "sender-brand-mismatch",
    severity: "high",
    title: "Sender name doesn't match the sending domain",
    description: `The sender name references ${displayBrand}, but the email address domain "${senderDomain}" is not an official ${displayBrand} domain.`,
    evidence: email.from.email,
  };
}

/** @param {PhishingEmail} email */
function checkReplyToMismatch(email) {
  if (!email.replyTo) return null;
  const fromDomain = extractDomain(email.from?.email);
  const replyDomain = extractDomain(email.replyTo);
  if (!fromDomain || !replyDomain || fromDomain === replyDomain) return null;
  return {
    id: "reply-to-mismatch",
    severity: "medium",
    title: "Reply-To address doesn't match the sender",
    description: `Replies would go to "${email.replyTo}" (${replyDomain}), a different domain than the sender's address (${fromDomain}). Legitimate senders rarely redirect replies like this.`,
    evidence: email.replyTo,
  };
}

/** @param {PhishingEmail} email */
function checkUrgencyLanguage(email) {
  const haystack = `${email.subject}\n${email.body}`.toLowerCase();
  const matched = URGENCY_PHRASES.filter((phrase) => haystack.includes(phrase));
  if (matched.length === 0) return null;
  return {
    id: "urgency-language",
    severity: "medium",
    title: "Uses urgency or threat language",
    description:
      "Phishing emails often create false urgency to pressure you into acting before you think it through.",
    evidence: matched.slice(0, 3).join(", "),
  };
}

/** @param {PhishingEmail} email */
function checkCredentialRequest(email) {
  const haystack = email.body.toLowerCase();
  const matched = CREDENTIAL_PHRASES.filter((phrase) => haystack.includes(phrase));
  if (matched.length === 0) return null;
  return {
    id: "credential-request",
    severity: "medium",
    title: "Asks for sensitive information",
    description:
      "Legitimate organizations don't usually ask you to confirm passwords, card numbers, or verification codes by email.",
    evidence: matched.slice(0, 3).join(", "),
  };
}

/** @param {PhishingEmail} email */
function checkGenericGreeting(email) {
  const firstLine = email.body.trim().split("\n")[0] ?? "";
  const matches = GENERIC_GREETINGS.some((re) => re.test(firstLine.trim()));
  if (!matches) return null;
  return {
    id: "generic-greeting",
    severity: "low",
    title: "Generic greeting instead of your name",
    description:
      'A greeting like "Dear Customer" can mean the sender is blasting this message to many people rather than a real account holder.',
    evidence: firstLine.trim(),
  };
}

/** @param {PhishingEmail} email */
function checkAttachmentMention(email) {
  const matches = email.body.match(SUSPICIOUS_ATTACHMENT_MENTION);
  if (!matches) return null;
  return {
    id: "suspicious-attachment-mention",
    severity: "medium",
    title: "References a risky file type",
    description:
      "Executable or script file types (.exe, .zip, .js, .scr, .bat, .vbs) are common malware delivery methods.",
    evidence: [...new Set(matches)].join(", "),
  };
}

/** @param {string} body */
function extractLinks(body) {
  /** @type {{ text: string, href: string }[]} */
  const links = [];
  let match;

  const mdRegex = new RegExp(MARKDOWN_LINK);
  while ((match = mdRegex.exec(body)) !== null) {
    links.push({ text: match[1], href: match[2] });
  }

  const withoutMarkdown = body.replace(MARKDOWN_LINK, " ");
  const bareRegex = new RegExp(BARE_URL);
  while ((match = bareRegex.exec(withoutMarkdown)) !== null) {
    links.push({ text: match[0], href: match[0] });
  }

  return links;
}

/** @param {PhishingEmail} email */
function checkLinks(email) {
  const links = extractLinks(email.body);
  /** @type {Flag[]} */
  const flags = [];

  for (const link of links) {
    const hrefDomain = extractDomain(link.href);
    if (!hrefDomain) continue;

    if (isIpAddressHost(hrefDomain)) {
      flags.push({
        id: `link-ip-${hrefDomain}`,
        severity: "high",
        title: "Link points to a raw IP address",
        description:
          "Legitimate organizations essentially never link to a bare IP address instead of a domain name.",
        evidence: link.href,
      });
      continue;
    }

    if (SHORTENER_DOMAINS.some((d) => hrefDomain === d)) {
      flags.push({
        id: `link-shortener-${hrefDomain}`,
        severity: "medium",
        title: "Link uses a URL shortener",
        description:
          "Shortened links hide the real destination until you click, which is why they're popular in phishing.",
        evidence: link.href,
      });
    }

    const anchorLooksLikeUrl = /^(https?:\/\/|www\.)/i.test(link.text.trim());
    if (anchorLooksLikeUrl) {
      const anchorDomain = extractDomain(link.text.trim());
      if (anchorDomain && anchorDomain !== hrefDomain) {
        flags.push({
          id: `link-anchor-mismatch-${hrefDomain}`,
          severity: "high",
          title: "Link text doesn't match its real destination",
          description: `The link displays as "${link.text.trim()}" but actually points to "${hrefDomain}".`,
          evidence: link.href,
        });
      }
    }

    const brand = findMentionedBrand(`${email.subject}\n${email.body}`);
    if (brand && !domainMatchesBrand(hrefDomain, brand)) {
      if (isLookalikeOfBrand(hrefDomain, brand)) {
        const displayBrand = BRAND_DISPLAY_NAMES[brand] ?? brand;
        flags.push({
          id: `link-brand-lookalike-${hrefDomain}`,
          severity: "high",
          title: "Link domain looks like a spoofed brand domain",
          description: `This email is about ${displayBrand}, but a link points to "${hrefDomain}", a lookalike of the real ${displayBrand} domain.`,
          evidence: link.href,
        });
      }
    }
  }

  return flags;
}

/**
 * Analyze a plain-object email for phishing red flags.
 * @param {PhishingEmail} email
 * @returns {{ score: number, riskLevel: "high"|"medium"|"low", riskLabel: string, flags: Flag[], links: {text: string, href: string}[] }}
 */
export function analyzeEmail(email) {
  const singleFlagChecks = [
    checkSenderBrandSpoofing,
    checkReplyToMismatch,
    checkUrgencyLanguage,
    checkCredentialRequest,
    checkGenericGreeting,
    checkAttachmentMention,
  ];

  /** @type {Flag[]} */
  const flags = [];
  for (const check of singleFlagChecks) {
    const result = check(email);
    if (result) flags.push(result);
  }
  flags.push(...checkLinks(email));

  const score = Math.min(
    100,
    flags.reduce((sum, flag) => sum + SEVERITY_WEIGHT[flag.severity], 0)
  );

  // A single high-severity flag (e.g. a spoofed sender domain) is disqualifying
  // on its own — risk level is driven by the strongest flag present, not just
  // an accumulated score, so one major red flag isn't diluted by its absence
  // of company.
  const hasHigh = flags.some((flag) => flag.severity === "high");
  const hasMedium = flags.some((flag) => flag.severity === "medium");

  let riskLevel = "low";
  let riskLabel = "Low risk — no strong red flags detected";
  if (hasHigh) {
    riskLevel = "high";
    riskLabel = "High risk — likely phishing";
  } else if (hasMedium) {
    riskLevel = "medium";
    riskLabel = "Suspicious — proceed with caution";
  } else if (flags.length > 0) {
    riskLabel = "Low risk — a few minor signals, but nothing strongly suspicious";
  }

  return {
    score,
    riskLevel,
    riskLabel,
    flags: flags.sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]),
    links: extractLinks(email.body),
  };
}
