# CyberAware — Expanded Attack Coverage: Research & Plan

> Purpose of this document: ground the widened scope of Simulations (and
> related Tools/Quizzes) in real evidence — industry breach data, established
> frameworks, and actual entry-level cybersecurity job requirements — rather
> than an invented list. Every attack type below is backed by a cited source.
> This is a planning reference, not a build log; PLAN.md remains the source
> of truth for what's actually been built and the sequential Build Order.

## 1. Why this document exists

The platform's original purpose (PLAN.md Section 1) was general-public
cybersecurity *awareness*. The scope is being widened: the platform should
also work as a **capability measurement / skill-building tool** — closer to
"can this person actually spot and respond to real attacks, at a level that
would make them useful in an entry-level security role or at least
conversant with security professionals" than passive reading. That's a
meaningful shift from *teaching facts* to *teaching by doing and measuring
what someone can do*, so the simulations, tools, and quizzes need to
resemble realistic scenarios and actually test the user, not just narrate
at them.

## 2. Evidence base

**Breach data — what actually happens, and how often:**
- Credential abuse (22%) and exploitation of vulnerabilities (20%) are the leading initial attack vectors industry-wide; phishing began 16% of breaches. Ransomware is present in 44% of all breaches, up 37% year-over-year. Third-party/vendor involvement in breaches doubled to 30%. 68% of breaches involved a human element (phishing, stolen credentials, or misconfiguration). — [Verizon 2025 Data Breach Investigations Report](https://www.verizon.com/about/news/2025-data-breach-investigations-report)
- **Ransomware is disproportionately an SMB problem**: ransomware is involved in 88% of breaches at small/medium businesses vs. 39% at large organizations; average SMB recovery cost is $638,536 excluding any ransom paid. — [StationX Small Business Cybersecurity Statistics 2026](https://app.stationx.net/articles/small-business-cybersecurity-statistics)
- AI-generated phishing content, cloned voices, and fake video calls are called out as the single biggest emerging threat to small businesses for 2026. — [SOTI: Biggest Cybersecurity Threats Businesses Face in 2026](https://soti.net/resources/blog/2025/biggest-cybersecurity-threats-businesses-face-in-2026-soti/)
- Public Wi-Fi: 43% of people who use public Wi-Fi have had their security compromised; common techniques are evil-twin/rogue access points, ARP spoofing, DNS spoofing, and SSL stripping. — [SecureW2 / Promon MITM via public Wi-Fi research](https://promon.io/mobile-attack-vector-library/man-in-the-middle-mitm-attacks-via-malicious-public-wi-fi)

**Attacker technique frameworks:**
- MITRE ATT&CK initial-access data (Mandiant M-Trends 2025): exploits (33%), stolen/valid credentials (16%, trending up from 14% in 2022 to 22% in 2025), phishing (14%) are the three dominant initial-access techniques. — [MITRE ATT&CK Initial Access research summary](https://attack.mitre.org/tactics/TA0001/)
- OWASP Top 10:2025 (application-security-specific, most relevant to developer/AppSec roles rather than end users): Broken Access Control, Security Misconfiguration, Software Supply Chain Failures (new), Insecure Design, Vulnerable/Outdated Components, Identification & Authentication Failures, Software/Data Integrity Failures, Logging & Monitoring Failures, Mishandling of Exceptional Conditions (new). — [OWASP Top 10:2025](https://owasp.org/Top10/2025/0x00_2025-Introduction/)

**What entry-level roles and certifications actually expect:**
- Entry-level cybersecurity analyst postings consistently ask for: networking fundamentals (TCP/IP, DNS, DHCP), log/alert analysis, MFA concepts, incident-response process, vulnerability assessment basics, and communication/report-writing — with CompTIA Security+/Network+ as the common baseline credential. — [Coursera: 15 Essential Cybersecurity Analyst Skills](https://www.coursera.org/articles/cybersecurity-analyst-skills), [InfoSec Institute: entry-level cybersecurity skills](https://www.infosecinstitute.com/resources/professional-development/how-to-land-an-entry-level-cybersecurity-job-essential-skills-and-certifications/)
- CompTIA Security+ (SY0-701) is organized into 5 domains: General Security Concepts, Threat Management, Security Architecture, Security Operations, and Governance/Risk/Compliance. — [CompTIA Security+ Exam Objectives 2025](https://destcert.com/resources/security-plus-exam-objectives/)

**Social engineering taxonomy (beyond phishing/smishing, already covered):**
- Pretexting (building a false backstory to earn trust before extracting information), Vishing (voice-call phishing, often with spoofed caller ID), Baiting (a tempting lure — USB drop, "free download," prize notification — that delivers malware or harvests credentials), Tailgating (physically following an authorized person into a restricted space), Quid Pro Quo (posing as IT/helpdesk offering "help" in exchange for credentials). — [Huntress: Types of Social Engineering Attacks](https://www.huntress.com/social-engineering-guide/types-of-social-engineering-attacks), [Arctic Wolf: Top Social Engineering Attack Types](https://arcticwolf.com/resources/blog/top-social-engineering-attack-types/)

## 3. What this means for feasibility (static, client-side, no backend)

The project is a fully static site — no backend, no accounts (a hard
constraint reaffirmed multiple times, most recently in Section 8 of
PLAN.md). That constraint doesn't change just because the scope is
widening, so every item below is evaluated against what's actually
buildable as **narrative simulation** (like the existing Phishing
walkthrough), a **hands-on analyzer tool** (like the Phishing Scanner /
Password Analyzer / URL Checker — genuinely "teaching by doing," since the
user is actively analyzing something, not watching a story), or a
**scenario-based quiz** (lower build cost, still tests judgment).

Some evidence-backed categories (e.g. OWASP's Broken Access Control,
Software Supply Chain Failures) are fundamentally about *application code*
and assume a developer/AppSec audience with a real backend to exploit —
they don't translate well into an end-user-facing static simulation without
misrepresenting what the vulnerability actually is. Those are flagged
below as **quiz/explainer only**, not full simulations, rather than forcing
a fake interactive demo that would teach the wrong mental model.

**Open question — flagging, not deciding:** "production-scalable solutions"
was mentioned as a goal for this pass. Everything proposed below still fits
inside the existing static-only architecture (no backend needed) — "scalable"
here is being read as *well-structured, reusable code* (matching the existing
`src/lib/` + reusable quiz-engine pattern), not as "add a backend." If an
actual backend/accounts system was intended, that reverses a standing
constraint and needs an explicit decision, the same way the local-storage
progress-tracking reversal was explicitly logged. Proceeding on the
non-backend reading unless told otherwise.

## 4. Prioritized, evidence-backed topic list

Legend: **Format** = Simulation (narrative walkthrough) / Tool (hands-on
analyzer) / Quiz (scenario-based questions). Items already in PLAN.md are
marked accordingly.

### Tier 1 — high evidence, high feasibility, directly extends what's already working

| Topic | Evidence | Format | Status |
|---|---|---|---|
| Phishing (email) | 16% of breaches, dominant social-engineering vector (Verizon DBIR; MITRE ATT&CK) | Simulation + Tool + Quiz | ✅ Built |
| Ransomware | 44% of all breaches, **88% of SMB breaches** (Verizon DBIR; StationX) | Simulation | Planned, Build Order step 8 |
| Fake/Rogue Wi-Fi (evil twin, MITM) | 43% of public Wi-Fi users compromised; ARP/DNS spoofing, SSL stripping (Promon/SecureW2) | Simulation | Planned, Build Order step 9 |
| Smishing (SMS phishing) | Same social-engineering family as phishing, high real-world volume | Simulation | Was Nice-to-have — promote to Tier 1 |
| Business Email Compromise (invoice/CEO fraud) | Explicitly named top SMB threat category; matches original target audience (small business employees) | Simulation | Was Nice-to-have — promote to Tier 1 |
| Vishing (voice phishing) | Named among top social-engineering types; AI voice-cloning flagged as the single biggest 2026 SMB threat (SOTI) | Simulation | **New** |
| Credential reuse / credential stuffing | **#1 initial attack vector at 22%** (Verizon DBIR) — currently under-represented; only touched indirectly by the Password Strength tool | Tool enhancement + Quiz | **New** |

### Tier 2 — valuable, evidence-backed, better suited to a lighter format

| Topic | Evidence | Format | Notes |
|---|---|---|---|
| Baiting / Quid Pro Quo (fake USB, fake IT support call) | Named social-engineering categories, strong SMB relevance | Simulation | Good narrative fit, similar shape to Phishing sim |
| Tailgating / physical security | Common social-engineering category, easy to visualize | Simulation (short) | Lower technical complexity |
| Pretexting | Named social-engineering category | Quiz (scenario-based) | Harder to visualize as a scene sequence than email/login-page formats; a "spot the pretext" scenario quiz fits better |
| MFA weaknesses (MFA-fatigue/bombing attacks) | OWASP A07 Identification & Authentication Failures; MFA explicitly named as a common job-posting topic | Tool enhancement | Extends the already-planned MFA Simulator tool rather than a new item |
| Third-party/supply-chain risk | Third-party involvement doubled to 30% of breaches (Verizon DBIR); new OWASP category | Quiz | SMB-relevant ("a vendor asks you to install this") but weak fit for a full narrative simulation |

### Tier 3 — evidence-backed but not a good fit for a full simulation on this platform

| Topic | Why it's here |
|---|---|
| Unpatched software / vulnerability exploitation | #2 initial vector (20%, Verizon DBIR) and a top MITRE technique, but meaningfully teaching it needs a mock patchable system — not achievable as a static narrative without being misleading |
| OWASP AppSec categories (Broken Access Control, Insecure Design, Supply Chain Failures, etc.) | These describe *how software gets built insecurely* — the audience is developers/AppSec, not end users. Only include as background/quiz trivia if the platform's audience is deliberately widening to include aspiring developers, not just "everyday users, students, small business employees" (PLAN.md Section 1) |

## 5. Design principle going forward: test, don't just narrate

Given the "measure capability, not just educate" goal, every new item
should include **at least one active, gradeable component** — a quiz, a
"spot the red flag" interaction, or a hands-on tool — not just a
click-through story. The existing Phishing content already does this
correctly: Simulation (narrative) + Scanner (hands-on tool) + Quiz
(graded). New topics should follow the same shape where the format allows,
per the tables above.

## 6. Checklist — proposed widened roadmap

- [x] Phishing — simulation, scanner tool, quiz (built)
- [ ] Ransomware simulation *(next in Build Order — unchanged)*
- [ ] Fake/Rogue Wi-Fi simulation *(unchanged)*
- [ ] Smishing simulation *(promoted from Nice-to-have)*
- [ ] Business Email Compromise simulation *(promoted from Nice-to-have)*
- [ ] Vishing simulation *(new)*
- [ ] Credential reuse / credential stuffing — Password tool enhancement + quiz *(new)*
- [ ] Baiting / Quid Pro Quo simulation *(new)*
- [ ] Tailgating / physical security short simulation *(new)*
- [ ] Pretexting scenario quiz *(new)*
- [ ] MFA-fatigue scenario added to the planned MFA Simulator tool *(enhancement)*
- [ ] Third-party/supply-chain risk quiz *(new)*
- [ ] Corresponding quiz added for every simulation above (matching the reusable quiz-engine pattern from Build Order step 6)

This checklist is a **reference for scope**, not a replacement for PLAN.md's
Build Order — Section 5 of PLAN.md is still what gets updated and checked
off as each item is actually built, one at a time, per the project's
established process.

## Sources

- [Verizon 2025 Data Breach Investigations Report](https://www.verizon.com/about/news/2025-data-breach-investigations-report)
- [Verizon 2025 DBIR — SMB Snapshot (PDF)](https://www.verizon.com/business/resources/infographics/2025-dbir-smb-snapshot.pdf)
- [StationX: Small Business Cybersecurity Statistics and Trends 2026](https://app.stationx.net/articles/small-business-cybersecurity-statistics)
- [SOTI: Biggest Cybersecurity Threats Businesses Face in 2026](https://soti.net/resources/blog/2025/biggest-cybersecurity-threats-businesses-face-in-2026-soti/)
- [MITRE ATT&CK — Initial Access (TA0001)](https://attack.mitre.org/tactics/TA0001/)
- [OWASP Top 10:2025 Introduction](https://owasp.org/Top10/2025/0x00_2025-Introduction/)
- [Coursera: 15 Essential Skills for Cybersecurity Analysts in 2026](https://www.coursera.org/articles/cybersecurity-analyst-skills)
- [InfoSec Institute: How to Land an Entry-Level Cybersecurity Job](https://www.infosecinstitute.com/resources/professional-development/how-to-land-an-entry-level-cybersecurity-job-essential-skills-and-certifications/)
- [DestCert: CompTIA Security+ Exam Objectives 2025](https://destcert.com/resources/security-plus-exam-objectives/)
- [Huntress: Types of Social Engineering Attacks](https://www.huntress.com/social-engineering-guide/types-of-social-engineering-attacks)
- [Arctic Wolf: Top Social Engineering Attack Types](https://arcticwolf.com/resources/blog/top-social-engineering-attack-types/)
- [Promon: Man-in-the-Middle Attacks via Malicious Public Wi-Fi](https://promon.io/mobile-attack-vector-library/man-in-the-middle-mitm-attacks-via-malicious-public-wi-fi)
- [KnowBe4 Security Awareness Training Library](https://www.knowbe4.com/products/security-awareness-training-library)
