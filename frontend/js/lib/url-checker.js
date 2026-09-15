/**
 * URL structure/safety heuristic analyzer.
 *
 * Pure, framework-free logic: takes a raw URL string and returns a
 * structural breakdown plus a list of suspicious-pattern flags with
 * explanations. No DOM access, no network calls — this never fetches or
 * follows the URL, it only inspects the string.
 */

/** @typedef {{ id: string, severity: "high"|"medium"|"low", title: string, description: string, evidence?: string }} Flag */

// Small brand list for teaching lookalike-domain / brand-in-subdomain tricks.
// Intentionally separate from the phishing email scanner's brand list —
// each tool in src/lib/ is self-contained per the project's folder-structure
// notes (PLAN.md Section 6), at the cost of a little duplication.
const KNOWN_BRANDS = {
  paypal: ["paypal.com"],
  microsoft: ["microsoft.com", "live.com", "outlook.com", "office.com"],
  apple: ["apple.com", "icloud.com"],
  amazon: ["amazon.com"],
  google: ["google.com", "gmail.com"],
  netflix: ["netflix.com"],
  chase: ["chase.com"],
  facebook: ["facebook.com"],
  instagram: ["instagram.com"],
};

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

const REDIRECT_PARAM_NAMES = ["redirect", "redirect_uri", "url", "next", "return", "dest", "destination"];

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

function isIpAddressHost(host) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
}

/** Detects a bare decimal/integer "IP address in disguise", e.g. http://3627734810/ */
function isDecimalIpHost(host) {
  if (!/^\d+$/.test(host)) return false;
  const value = Number(host);
  return Number.isFinite(value) && value > 0 && value <= 4294967295;
}

/** Naive registrable-domain split (last two labels). Good enough for a teaching tool; doesn't handle multi-part TLDs like co.uk. */
function splitHostLabels(hostname) {
  const labels = hostname.split(".");
  const registrable = labels.length >= 2 ? labels.slice(-2).join(".") : hostname;
  const subLabels = labels.slice(0, -2);
  return { labels, registrable, subLabels };
}

function findMentionedBrand(text) {
  const lower = text.toLowerCase();
  return Object.keys(KNOWN_BRANDS).find((brand) => lower.includes(brand)) ?? null;
}

function domainMatchesBrand(domain, brand) {
  return KNOWN_BRANDS[brand].some((d) => domain === d || domain.endsWith(`.${d}`));
}

function isLookalikeOfBrand(label, brand) {
  const distance = levenshtein(label, brand.replace(/\s+/g, ""));
  return distance > 0 && distance <= 2 && label.length >= brand.length - 2;
}

// Schemes that are valid without a "//" (opaque URIs). Without checking for
// these explicitly, "javascript:alert(1)" would fail to be recognized as
// having a protocol at all (no "//"), get "http://" prepended, and then fail
// to parse — silently hiding one of the most dangerous URL patterns instead
// of flagging it.
const OPAQUE_SCHEMES = ["javascript", "data", "mailto", "tel", "vbscript", "file"];

function tryParseUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  const hasSlashProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const hasOpaqueScheme = Boolean(
    schemeMatch && OPAQUE_SCHEMES.includes(schemeMatch[1].toLowerCase())
  );
  // A bare "host:port" (e.g. "example.com:8080/path") also matches the
  // scheme pattern syntactically, so only slash-protocols and a known list
  // of opaque schemes count — anything else is treated as protocol-less.
  const hasProtocol = hasSlashProtocol || hasOpaqueScheme;

  const candidate = hasProtocol ? trimmed : `http://${trimmed}`;
  try {
    const url = new URL(candidate);

    // Browser URL parsers are far more lenient than the spec's error cases
    // suggest — Chromium happily accepts "not a url at all!!" by silently
    // percent-encoding the spaces into the hostname rather than throwing.
    // A legitimate hostname is never percent-encoded (IDN uses punycode,
    // not %-escapes), so treat that as a sign this wasn't a real URL/host.
    const isWebProtocol = url.protocol === "http:" || url.protocol === "https:";
    if (isWebProtocol && (url.hostname.includes("%") || !url.hostname)) {
      return null;
    }

    return { url, hadProtocol: hasProtocol };
  } catch {
    return null;
  }
}

const SEVERITY_WEIGHT = { high: 30, medium: 15, low: 6 };

/**
 * Analyze a raw URL string for structural red flags.
 * @param {string} rawUrl
 * @returns {{
 *   valid: boolean,
 *   score: number,
 *   riskLevel: "high"|"medium"|"low",
 *   riskLabel: string,
 *   flags: Flag[],
 *   breakdown: null | {
 *     protocol: string, hostname: string, port: string, path: string,
 *     queryParams: { key: string, value: string }[], hadProtocol: boolean
 *   }
 * }}
 */
export function analyzeUrl(rawUrl) {
  const parsed = tryParseUrl(rawUrl);

  if (!parsed) {
    return {
      valid: false,
      score: 0,
      riskLevel: "low",
      riskLabel: "Couldn't parse this as a URL",
      flags: [],
      breakdown: null,
    };
  }

  const { url, hadProtocol } = parsed;
  const hostname = url.hostname.toLowerCase();
  const { registrable, subLabels } = splitHostLabels(hostname);

  /** @type {Flag[]} */
  const flags = [];

  if (["javascript:", "data:", "file:", "vbscript:"].includes(url.protocol)) {
    flags.push({
      id: "dangerous-protocol",
      severity: "high",
      title: "Uses a dangerous protocol",
      description: `The "${url.protocol}" protocol can execute code or access local files rather than just opening a webpage.`,
      evidence: url.protocol,
    });
  } else if (url.protocol === "http:") {
    flags.push({
      id: "not-https",
      severity: "medium",
      title: "Not using a secure connection (HTTPS)",
      description:
        "Anything sent to or from this site — including text typed into forms — isn't encrypted in transit.",
      evidence: "http://",
    });
  }

  if (isIpAddressHost(hostname)) {
    flags.push({
      id: "ip-address-host",
      severity: "high",
      title: "Uses a raw IP address instead of a domain name",
      description:
        "Legitimate organizations essentially never link directly to an IP address — this is common in phishing and malware delivery.",
      evidence: hostname,
    });
  } else if (isDecimalIpHost(hostname)) {
    flags.push({
      id: "decimal-ip-host",
      severity: "high",
      title: "Numeric IP address in disguise",
      description:
        "This host is a plain number, which browsers silently interpret as an IP address — a common trick to obscure the real destination.",
      evidence: hostname,
    });
  } else if (hostname.includes("xn--")) {
    flags.push({
      id: "punycode-domain",
      severity: "high",
      title: "Internationalized domain name (punycode)",
      description:
        "This domain uses non-standard characters encoded as \"xn--\", which can be used to visually impersonate a well-known domain.",
      evidence: hostname,
    });
  } else {
    const brandInSubdomain = subLabels.length > 0 ? findMentionedBrand(subLabels.join(".")) : null;
    const brandInRegistrable = findMentionedBrand(registrable);

    if (brandInSubdomain && !domainMatchesBrand(registrable, brandInSubdomain)) {
      flags.push({
        id: "brand-in-subdomain",
        severity: "high",
        title: "Brand name used as a subdomain, not the real domain",
        description: `"${subLabels.join(".")}" looks like it references a known brand, but the actual domain being linked to is "${registrable}" — browsers only trust the real (rightmost) domain.`,
        evidence: hostname,
      });
    } else if (brandInRegistrable && !domainMatchesBrand(registrable, brandInRegistrable)) {
      const label = registrable.split(".")[0];
      if (isLookalikeOfBrand(label, brandInRegistrable)) {
        flags.push({
          id: "lookalike-domain",
          severity: "high",
          title: "Domain looks like a spoofed brand domain",
          description: `"${registrable}" is a lookalike of the real ${brandInRegistrable} domain, not the real thing.`,
          evidence: registrable,
        });
      }
    }

    if (SHORTENER_DOMAINS.includes(registrable)) {
      flags.push({
        id: "url-shortener",
        severity: "medium",
        title: "Uses a URL shortener",
        description:
          "Shortened links hide the real destination until you click, which is why they're popular in phishing.",
        evidence: registrable,
      });
    }

    const hyphenCount = (registrable.match(/-/g) || []).length;
    if (hyphenCount >= 3) {
      flags.push({
        id: "excessive-hyphens",
        severity: "medium",
        title: "Domain has an unusually high number of hyphens",
        description:
          "Stringing several words together with hyphens (e.g. \"secure-login-verify-account\") is a common way to make a fake domain sound trustworthy.",
        evidence: registrable,
      });
    }
  }

  // Only meaningful for web URLs — in a mailto: link, "@" is just normal
  // email address syntax, not a hidden-destination trick.
  const isWebProtocol = url.protocol === "http:" || url.protocol === "https:";
  if (isWebProtocol && rawUrl.includes("@")) {
    const beforeProtocolStripped = rawUrl.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    if (beforeProtocolStripped.includes("@")) {
      flags.push({
        id: "at-symbol-trick",
        severity: "high",
        title: 'Contains an "@" symbol before the real address',
        description:
          'Browsers treat everything before an "@" as ignorable login info and go to whatever comes after it — this can be used to make a link look like it points somewhere trustworthy.',
        evidence: rawUrl,
      });
    }
  }

  const redirectParam = [...url.searchParams.keys()].find((key) =>
    REDIRECT_PARAM_NAMES.includes(key.toLowerCase())
  );
  if (redirectParam) {
    flags.push({
      id: "redirect-parameter",
      severity: "medium",
      title: "Contains a redirect parameter",
      description: `The "${redirectParam}" parameter can send visitors to a completely different site after they land here.`,
      evidence: `${redirectParam}=${url.searchParams.get(redirectParam)}`,
    });
  }

  if (rawUrl.length > 100) {
    flags.push({
      id: "unusually-long-url",
      severity: "low",
      title: "Unusually long URL",
      description:
        "Very long URLs can be used to bury the real domain or hide encoded data further down the string.",
      evidence: `${rawUrl.length} characters`,
    });
  }

  if (url.port && !["80", "443", ""].includes(url.port)) {
    flags.push({
      id: "non-standard-port",
      severity: "low",
      title: "Uses a non-standard port",
      description: `Port ${url.port} isn't the default for web traffic, which is sometimes used to run services outside normal monitoring.`,
      evidence: `:${url.port}`,
    });
  }

  const hasHigh = flags.some((f) => f.severity === "high");
  const hasMedium = flags.some((f) => f.severity === "medium");

  let riskLevel = "low";
  let riskLabel = "Low risk — no strong red flags detected";
  if (hasHigh) {
    riskLevel = "high";
    riskLabel = "High risk — likely malicious";
  } else if (hasMedium) {
    riskLevel = "medium";
    riskLabel = "Suspicious — proceed with caution";
  } else if (flags.length > 0) {
    riskLabel = "Low risk — a few minor signals, but nothing strongly suspicious";
  }

  const score = Math.min(100, flags.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0));

  return {
    valid: true,
    score,
    riskLevel,
    riskLabel,
    flags: flags.sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]),
    breakdown: {
      protocol: url.protocol.replace(":", ""),
      hostname,
      port: !hostname
        ? "n/a"
        : url.port || (url.protocol === "https:" ? "443 (default)" : "80 (default)"),
      path: url.pathname || "/",
      queryParams: [...url.searchParams.entries()].map(([key, value]) => ({ key, value })),
      hadProtocol,
    },
  };
}
