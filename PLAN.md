# CyberAware — Interactive Cybersecurity Awareness Platform

> This file is the source of truth for scope, structure, and build order.
> Claude Code should read this before making structural changes, and this
> file should be updated whenever a decision changes so future sessions
> stay in sync.

## 1. Project Summary

CyberAware is a free, educational website that teaches everyday users to
recognize and respond to common cyber threats through interactive
simulations and practical tools — not long-form articles or passive
videos. Everything is educational only: no real attacks are performed,
no sensitive user data is collected.

**Target audience:** general internet users, students, small business
employees.

**Core promise:** turn cybersecurity awareness into something practical,
visual, and memorable.

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Structure | Static site (Astro or Vite + vanilla JS) | Content is mostly static; interactive tools are client-side logic, not server logic |
| Styling | Tailwind CSS | Fast iteration, easy consistent theming |
| Interactivity | Vanilla JS (or small JS modules per tool) | No framework knowledge required beyond what's already known; each tool is self-contained |
| Data | None server-side — all checks run client-side | Keeps "no data collection" true by construction, avoids backend/auth complexity entirely |
| Hosting | Static host (Netlify / Vercel / GitHub Pages) | Zero-cost, zero-maintenance deployment for a static site |
| Accessibility | Reduced-motion support, keyboard nav on all interactive tools | Animations are central to the product — must degrade gracefully |

**Decision needed before scaffolding:** confirm no account system /
no backend. Plan below assumes fully static + client-side, which is the
simpler and recommended path unless there's a specific reason to add a
backend later (e.g. saving progress across devices).

## 3. Site Map / Pages

```
/                       Landing page — value prop, threat categories, CTA into simulations
/roadmap/               Guided path through every simulation/tool/quiz, by domain and level, with progress
/simulations/           Hub linking to each animated threat walkthrough
  /phishing             Animated: how a phishing attack unfolds, step by step
  /ransomware           Animated: how ransomware spreads and locks a system
  /fake-wifi             Animated: how a fake/rogue Wi-Fi hotspot intercepts traffic
  /smishing              Animated: SMS phishing walkthrough
  /business-email-compromise   Animated: CEO/invoice fraud walkthrough (small-business focus)
  /vishing               Animated: voice-phishing call walkthrough (see SIMULATION-SCOPE-RESEARCH.md)
  /baiting               Animated: fake USB drive / "free download" lure walkthrough
  /tailgating            Animated: physical follow-in-the-door walkthrough
/tools/                 Hub linking to each interactive checker
  /phishing-scanner     Paste/upload a sample email → red flags highlighted + explanations
  /mfa-simulator        Demonstrates MFA methods (SMS, authenticator app, hardware key) and how each can be attacked
  /password-strength    Analyzes a password locally, explains weaknesses
  /url-checker          Analyzes a URL's structure locally, flags suspicious patterns
/quizzes/               Interactive quizzes per threat category, with explanations on wrong answers
  /pretexting            Quiz-only (no matching simulation — see SIMULATION-SCOPE-RESEARCH.md Tier 2)
  /credential-reuse      Quiz-only, pairs with the Password Strength tool enhancement
  /third-party-risk      Quiz-only (SMB vendor/supply-chain scenarios)
/progress/              "My Progress" — activity log of everything completed, by domain and by type
/about/                 Project purpose, "no data collected" statement, methodology
```

Nav is grouped in the header as: Roadmap · Explore (hover/click dropdown:
Simulations, Tools, Quizzes) · My Progress · About — see Section 7,
2026-08-29, for why the three hub pages were consolidated under one
dropdown instead of three separate top-level links, and why the
Report-a-real-one page (previously listed here) was removed entirely.

## 4. Feature List (with priority)

### Must-have (MVP)
- [x] Landing page with clear navigation into simulations, tools, quizzes
- [x] Phishing simulation (animated walkthrough)
- [x] Phishing Email Scanner tool
- [x] Password strength analyzer
- [x] URL safety checker
- [x] At least 1 quiz tied to phishing content
- [x] Reduced-motion mode + keyboard navigation baseline

### Should-have
- [x] Ransomware simulation
- [x] Fake Wi-Fi simulation
- [x] Smishing (SMS phishing) simulation *(promoted from Nice-to-have — see Section 7 and SIMULATION-SCOPE-RESEARCH.md)*
- [x] Business email compromise simulation *(promoted from Nice-to-have)*
- [x] Vishing (voice phishing) simulation *(new — see SIMULATION-SCOPE-RESEARCH.md)*
- [x] Baiting / Quid Pro Quo simulation *(new)*
- [x] Tailgating / physical security simulation *(new)*
- [x] Quizzes for every simulation above, plus quiz-only topics (Pretexting, Credential reuse, Third-party risk)
- [x] MFA / 2FA simulator (including an MFA-fatigue attack scenario)
- [x] Credential reuse / credential stuffing enhancement to the Password Strength tool
- [x] ~~"Report a real one" checklist page~~ — built 2026-08-29, then
  **removed the same day** at the user's explicit request (see Section 7)

### Should-have (moved up from Nice-to-have — see Section 7)
- [x] Journey/progress tracking: which tools were tried, which simulations were viewed, and quiz completions + scores, stored in local storage — a dedicated "My Progress" page plus inline "Completed" badges on the Tools/Simulations/Quizzes hub pages

### Nice-to-have (post-MVP)
- [x] Dark/light theme toggle

## 5. Build Order

Build one vertical slice at a time — full UI + logic + content for a
single feature — before moving to the next. Do not scaffold all pages
at once.

1. [x] Project scaffold: folder structure, Tailwind setup, base layout/nav, landing page shell
2. [x] Phishing Email Scanner (full: UI, sample emails, detection logic, explanation panel)
3. [x] Password strength analyzer
4. [x] URL safety checker
5. [x] Phishing simulation (animated walkthrough)
6. [x] First quiz (phishing-based) + quiz engine (reusable for future quizzes)

**Simulations section — complete entirely before moving on (per explicit instruction, 2026-08-28):**
7. [x] Ransomware simulation
8. [x] Fake/Rogue Wi-Fi simulation
9. [x] Smishing simulation
10. [x] Business Email Compromise simulation
11. [x] Vishing simulation
12. [x] Baiting / Quid Pro Quo simulation
13. [x] Tailgating / physical security simulation

**Quizzes section — complete entirely next, one per simulation topic above plus the quiz-only topics:**
14. [x] Ransomware quiz
15. [x] Fake/Rogue Wi-Fi quiz
16. [x] Smishing quiz
17. [x] Business Email Compromise quiz
18. [x] Vishing quiz
19. [x] Baiting / Quid Pro Quo quiz
20. [x] Tailgating quiz
21. [x] Pretexting scenario quiz (quiz-only topic, no matching simulation)
22. [x] Credential reuse / credential stuffing quiz
23. [x] Third-party/supply-chain risk quiz (SMB-focused)

**Tools completion + Progress Tracking:**
24. [x] MFA/2FA simulator tool, including an MFA-fatigue attack scenario
25. [x] Credential reuse / credential stuffing enhancement to the Password Strength tool
26. [x] Journey/progress tracking system: local-storage-based tracking of tools tried, simulations viewed, and quiz scores, surfaced via a dedicated "My Progress" page and inline badges on the Tools/Simulations/Quizzes hubs

**Remaining:**
27. [x] ~~Report-a-real-one checklist~~ (removed 2026-08-29, see Section 7) + About page
28. [x] Nice-to-have features, accessibility polish pass, mobile QA pass

## 6. Folder Structure (proposed)

```
cyberaware/
├── PLAN.md
├── SIMULATION-SCOPE-RESEARCH.md  # cited evidence behind the widened scope (2026-08-28)
├── index.html
├── src/
│   ├── styles/
│   │   └── main.css              # Tailwind entry
│   ├── layouts/
│   │   └── BaseLayout.*          # shared nav/footer
│   ├── pages/
│   │   ├── roadmap/              # domain × level curriculum view (added 2026-08-28)
│   │   ├── simulations/
│   │   ├── tools/
│   │   ├── quizzes/
│   │   ├── progress/             # "My Progress" activity log (added 2026-08-29)
│   │   └── about/
│   ├── components/
│   │   ├── Nav.astro, Footer.astro
│   │   └── ...
│   ├── lib/
│   │   ├── phishing-detector.js  # scanner logic, isolated from UI
│   │   ├── password-analyzer.js
│   │   ├── url-checker.js
│   │   ├── quiz-engine.js        # reusable across all quizzes (actually in lib/, not components/ — see Step 6 notes)
│   │   └── progress-store.js     # localStorage completion tracking, read by the Roadmap now and the future "My Progress" page (step 26)
│   └── data/
│       ├── curriculum.js         # single source of truth: every simulation/tool/quiz's domain + difficulty level (added 2026-08-28)
│       ├── sample-emails.json    # phishing scanner test cases
│       └── quiz-questions/       # one file per quiz
└── public/
    └── assets/
```

Logic (`lib/`) is kept separate from UI so each detector/analyzer can be
unit-tested and reused (e.g. the same phishing-detector logic could
back both the standalone scanner tool and a quiz question).

## 7. Open Decisions

- [x] Confirm: fully static, no backend, no accounts (recommended default above)
- [x] Confirm: Astro vs. plain Vite + vanilla JS as the base tooling — **Decided: Astro.** File-based routing maps directly onto the site map (Section 3), ships zero JS by default with opt-in interactive islands for tools/simulations, and `src/lib/` detector modules stay plain JS/TS with no framework lock-in.
- [x] Decide: local-storage-based progress tracking, or skip entirely for MVP — **Originally decided: skip for MVP** (revisit at step 12). **Reversed 2026-08-28:** user asked for a site-wide "journey/progress review" system (explicitly comparing it to W3Schools' progress tracking), covering tools tried, simulations viewed, and quiz scores. Moved from Nice-to-have to Should-have in Section 4; now Build Order step 26 (renumbered again the same day — see the widened-scope entry below). Scope confirmed with the user: track everything (not quizzes-only), surfaced via both a dedicated "My Progress" page and inline "Completed" badges on the Tools/Simulations/Quizzes hub pages. Still local-storage only — no accounts, no backend, no change to that constraint.

**Widened Simulations/Quizzes scope + section-by-section reordering (2026-08-28).** Two related decisions made the same day, after the progress-tracking reversal above:
1. **Reordering:** user asked to complete each site *section* fully before moving to the next, rather than interleaving — so the Build Order was regrouped into a Simulations block (steps 7–13), then a Quizzes block (14–23), then Tools completion + Progress Tracking (24–26), then the remainder (27–28). See Section 5.
2. **Widened scope:** user asked to research common real-world cyberattacks and entry-level cybersecurity job requirements, and widen the Simulations scope accordingly — reframing part of the platform's purpose from pure public awareness toward measuring/building actual capability ("teaching by doing," closer to a skills gauge than passive reading). Full cited research and the prioritized topic list live in **`SIMULATION-SCOPE-RESEARCH.md`** (project root) — Verizon DBIR, MITRE ATT&CK, OWASP Top 10:2025, CompTIA Security+ domains, and named social-engineering taxonomy (vishing, pretexting, baiting, tailgating, quid pro quo) all cited with sources. Promoted from Nice-to-have to Should-have: Smishing and Business Email Compromise simulations. Newly added: Vishing, Baiting/Quid Pro Quo, and Tailgating simulations; Pretexting, Credential-reuse, and Third-party-risk quiz-only topics; an MFA-fatigue scenario added to the planned MFA Simulator; a credential-reuse enhancement to the Password Strength tool. Some evidence-backed categories (unpatched-software exploitation, OWASP AppSec categories like Broken Access Control) were deliberately *not* added as full simulations — they assume a developer/AppSec audience with a real exploitable backend, which conflicts with the platform's static-only architecture and general-audience purpose; see the research doc's Tier 3 for the reasoning. **No change to the no-backend/no-accounts constraint** — "production-scalable" was read as well-structured, reusable code (matching the existing `src/lib/` + quiz-engine pattern), not as license to add a backend; flagged as an assumption in the research doc rather than decided silently.

**Rename: CyberGuard → CyberAware (branding-only).** Project renamed after Step 3. Applied across PLAN.md, `package.json` name field, page titles/meta descriptions, nav branding, and footer copyright text. No feature names, tool names, file paths, or folder structure changed — this was a find-and-replace of the product name only.

**Scaffold notes (Step 1, completed):**
- Astro's `create-astro` scaffolder refuses to write into a non-empty directory, so it initially generated into a temp subfolder; contents were moved up to project root. `package.json` name set to `cyberaware` (project renamed from CyberGuard to CyberAware afterward — see Section 7).
- Tailwind added via the official `astro add tailwind` integration (Tailwind v4, `@tailwindcss/vite` plugin) rather than a manual PostCSS setup — this is now Astro's recommended path and required no extra config beyond importing the stylesheet.
- Tailwind entry file is `src/styles/main.css` (renamed from the integration's default `global.css` to match Section 6).
- Nav/footer are Astro components (`src/components/Nav.astro`, `Footer.astro`) rather than the `nav.js` named in Section 6 — Astro components are the idiomatic way to build server-rendered, interactive-when-needed UI pieces in this stack; plain `.js` modules are reserved for framework-agnostic logic (`src/lib/`, and small islands of client-side behavior like the nav's mobile-menu toggle).
- `BaseLayout.astro` includes a skip-to-content link, and `Nav.astro` has keyboard-operable focus states and a labelled, `aria-expanded` mobile toggle — establishing the accessibility baseline (Section 4) from the first slice, per the project ground rules.
- Verified: `npm run dev` serves the landing page (200 OK, correct title/nav links/skip link), and `npm run build` produces a working static build with compiled Tailwind CSS linked via `<link rel="stylesheet">`.

**Phishing Email Scanner notes (Step 2, completed):**
- Detection logic lives in `src/lib/phishing-detector.js` as pure, DOM-free functions (`analyzeEmail(email)` plus internal checks) — verified directly with Node (no browser/build step needed) against all six sample emails and several hand-written edge cases (weak-signal-only, link anchor/destination mismatch, empty input).
- Risk level is driven by the *strongest* flag present (any single high-severity flag → "High risk"), not a pure accumulated-score threshold — an earlier score-threshold-only version under-classified some single-red-flag phishing samples as merely "Suspicious." The numeric score (0–100) is still shown for context.
- Links found in an email body (Markdown-style `[text](href)` or bare URLs) are extracted by `src/lib/phishing-detector.js` and rendered in the UI as **plain text only, never as real clickable `<a>` links** — this applies to arbitrary pasted user input, not just the curated samples, so the tool can never be used to accidentally navigate to a malicious URL. Noting this as a deliberate security-relevant deviation from a literal reading of "explanation panel."
- `src/data/sample-emails.json` includes 4 phishing examples (brand spoofing, IP-address link, urgency/credential requests, URL shortener) and 2 legitimate examples (real domains, personalized greetings, no urgency) — verified the tool produces zero false positives on the legitimate samples.
- Added `/tools/` hub page (not separately itemized in Build Order, but required so the nav's existing `/tools/` link resolves) listing all four planned tools; only the Phishing Email Scanner links out, the rest show a "Coming soon" badge with no href, so no dead links are introduced ahead of their own Build Order steps.
- Verified end-to-end in an actual browser (not just static HTML): loaded a sample via click, submitted the form, confirmed the risk banner/flags/links render correctly and zero console errors — via a headless Chromium session (Edge + puppeteer-core), not just `curl`.

**Password Strength Analyzer notes (Step 3, completed):**
- Detection logic lives in `src/lib/password-analyzer.js`, verified directly with Node against 14 hand-picked passwords (common passwords, keyboard walks, disguised dictionary words, all-digit PINs, long passphrases, high-entropy random strings) before any UI was built.
- Found and fixed two real bugs during that verification: (1) the crack-time estimate used pure brute-force math even for keyboard-walk/disguised-dictionary-word passwords, which understated risk since real attackers use dictionary + mutation-rule attacks first (e.g. `qwertyuiop` showed a reassuring "2 hours" despite being trivially guessable) — fixed so those patterns show "seconds to minutes" instead; (2) a pluralization bug showed "1 hours" / "1 years" — fixed.
- The analyzer runs live on every keystroke (not on submit) since it's cheap, pure computation with no network calls — this matches how real strength meters are used and is more educational (see the score react as you type).
- Accessibility approach for the live meter: the visual meter, character-type checklist, and weaknesses list update on every keystroke as plain (non-`aria-live`) content associated to the input via `aria-describedby`, so screen reader users can review them on demand without being interrupted after every character. A separate visually-hidden `aria-live="polite"` region only announces when the strength *label* actually changes tier (not on every keystroke), to avoid spamming.
- Password field uses `autocomplete="new-password"` and `spellcheck="false"` so browsers/password managers don't try to autofill or store whatever gets typed in for testing; the page also explicitly tells users not to type a password they actually use.
- Verified end-to-end in a real headless browser: typed a weak and a fresh strong password, confirmed the live meter/score/character-checklist/flags update correctly, confirmed the show/hide toggle works via both mouse and keyboard (native `<button>` + Enter), zero console errors.

**URL Safety Checker notes (Step 4, completed):**
- Detection logic lives in `src/lib/url-checker.js`, following the same pattern as the other two tools (independent check functions + one orchestrator, `analyzeUrl()`), verified through the actual browser runtime (not just Node) against 16 hand-picked URLs.
- Found and fixed two real bugs during that verification: (1) the protocol-detection regex only recognized schemes followed by `//` (like `http://`), so `javascript:alert(1)` — one of the most dangerous patterns this tool should catch — silently failed to parse instead of being flagged; fixed by recognizing a small list of known opaque schemes (`javascript:`, `data:`, `mailto:`, etc). (2) Chromium's `URL` parser is far more lenient than Node's — it silently percent-encodes garbage like `"not a url at all!!"` into a fake hostname instead of throwing, which Node testing alone didn't catch. Added an explicit plausibility check (reject hostnames containing `%`) since testing exclusively in Node would have missed this.
- Sample URLs expanded from the original 3-button skeleton to 5 (added "brand used as a subdomain" and "URL shortener") for better tactic coverage — flagged and approved mid-Phase-3 as a deviation from the already-reviewed Phase 2 layout.
- Phase 4 (accessibility/mobile) confirmed: full keyboard operability (tab order, Enter-to-activate sample buttons), `prefers-reduced-motion` respected, no horizontal overflow at 375px width.

**Phishing Simulation notes (Step 5, completed):**
- Built as 6 static "scenes" (The Bait, It Lands, The Hook, The Trap, The Catch, The Damage) in `src/pages/simulations/phishing.astro`, all rendered in the raw HTML for progressive enhancement — client JS only hides all-but-the-first once it actually runs, so a JS failure falls back to "show everything" rather than a blank page.
- Uses a fictional brand ("SecurePay") for the fake email/login-page mockups rather than a real company's visual design — confirmed with the user first. Real brand *names* still appear as plain text elsewhere (phishing scanner samples), but recreating an actual company's login page UI was judged more trademark-sensitive than that.
- Found and fixed a real bug during Phase 3 self-testing: rapid double/triple-clicking "Next" only advanced one step instead of three, because `currentIndex` was only updated inside the fade animation's `setTimeout` callback — each rapid click read the same stale value. Fixed by updating the step index and all visible chrome (indicator, pills, button states) synchronously and immediately, decoupled from the animation timing.
- Found and fixed a real accessibility gap during Phase 4: the step-indicator pills (1. The Bait, etc.) were plain `<li>` elements with only a mouse click handler — not focusable, not keyboard-operable at all. Converted to real `<button>` elements and added `aria-current="step"` on the active one.
- After each scene transition, focus moves programmatically to the new scene's heading (`tabindex="-1"` + `.focus()`), so keyboard/screen-reader users are taken to the new content automatically rather than needing to hunt for it.
- Arrow-key (←/→) navigation is deliberately scoped to only fire when focus is already within the walkthrough (the nav buttons, a pill, or a scene), not bound globally on `document` — so it never hijacks arrow keys a screen reader user might be using elsewhere on the page.
- Investigated an odd icon overlay in a full-page mobile screenshot; traced it to Astro's dev-only toolbar element (fixed-position UI that only exists under `astro dev`), confirmed absent from `npm run build` output — not a page bug.

**First Quiz + Quiz Engine notes (Step 6, completed):**
- `src/lib/quiz-engine.js` is a genuinely reusable engine, not just another per-tool lib module: it operates on a fixed "shell" of expected element IDs (see `src/pages/quizzes/phishing.astro`) and dynamically builds the answer options from whatever `options` array a question provides. A future quiz page only needs to copy the same HTML shell, write its own question JSON, and call `createQuiz({ root, questions })` — no per-quiz JS.
- 5 real questions in `src/data/quiz-questions/phishing.json`, deliberately reinforcing the same red flags already taught by the phishing scanner and simulation (domain spoofing, urgency tactics, link/destination mismatches, safe verification habits, lookalike domains) rather than introducing new unrelated content.
- Per the user's explicit requirement, an explanation is shown after *every* answer, correct or wrong — not just on misses.
- When an answer is wrong, both the option the user picked *and* the actually-correct option are visually marked (not just "you were wrong") — the lesson should land even on a miss.
- Found and fixed a real WCAG 1.4.1 issue during Phase 4: the correct/incorrect option marking after submitting relied on border/background color alone. Added visible text markers ("✓ Correct answer" / "✗ Your answer") so the distinction doesn't depend on color perception at all.
- Verified end-to-end in a real browser: wrong-answer and correct-answer flows, the full 5-question run ending on the results screen with the right score/message, "Try Again" fully resetting state, keyboard-only operation (Space to select, one Tab to exit the radio group — confirmed correct native behavior after an initial test-script miscount), and no horizontal overflow on mobile even with the added marker text.

**Curriculum architecture + Roadmap system, and Ransomware/Fake Wi-Fi simulations (Steps 7–8, completed 2026-08-28, batch-implemented):**
- New architecture layer, ahead of Step 26: `src/data/curriculum.js` (`DOMAINS`, `LEVELS`, `CURRICULUM_ITEMS` — single source of truth for what every simulation/tool/quiz is, which of the 5 domains it belongs to, and its 1–5 difficulty level) and `src/lib/progress-store.js` (minimal localStorage completion tracking — `markCompleted`, `isCompleted`, `getProgressSummary`). Both are deliberately the *foundation* the full Step 26 "My Progress" page will build on, not a separate thing to migrate later — same storage key, same schema.
- New page `src/pages/roadmap/index.astro` — shows every item grouped by domain and level, with 4 real states (Completed / Ready / Locked / Not built yet). A level unlocks only once every *available* item at a lower level in the same domain is completed — items that don't exist yet don't block anything. Added to the main nav.
- `quiz-engine.js` now accepts an optional `itemId` and calls `markCompleted` (with the score) when a quiz finishes — added generically in the engine itself, so every future quiz gets progress-tracking for free, not just Phishing. The Phishing simulation and all 3 existing tools were retroactively wired to call `markCompleted` too, so the Roadmap has real data instead of being decorative.
- Domain/level assignments are justified in `SIMULATION-SCOPE-RESEARCH.md`, not arbitrary — e.g. Phishing/Password/URL-checking sit at Level 1 (foundational), Ransomware and Fake Wi-Fi at Level 2 (build on Level-1 concepts), Level 5 ("Stress Test") is deliberately left empty for now, reserved for a future chained/adversarial capstone scenario rather than force-fitting existing content into it.
- Ransomware and Fake Wi-Fi simulations were **batch-implemented together** in one pass (per explicit instruction) rather than going through separate paused review phases per item — both reuse the exact scene-transition/keyboard/reduced-motion/focus-management code pattern already proven correct in the Phishing simulation (Step 5), so none of Phishing's original bugs (stale index on rapid clicks, non-keyboard-operable pills) had to be rediscovered. A full self-test battery (rapid-click race, keyboard pill activation, `aria-current`, reduced-motion, mobile overflow, progress-tracking, zero console errors) was run against both before considering them done.
- Still caught one **new** bug during self-review despite reusing proven code: the same Astro whitespace-collapse issue hit twice before (text immediately followed by an inline `<span>`/`<code>` on the next line loses its space) showed up a third time in Ransomware's ransom-note text ("within72 hours"). Fixed the same way as before (keep the tag opening on the same line as the preceding word) and this time swept both new files for the pattern before calling them done, rather than only catching it via screenshot review.
- Simulations hub (`src/pages/simulations/index.astro`) updated to flip Ransomware and Fake Wi-Fi from "Coming soon" to real links; the curriculum's `available: true` flags for both were set *before* the files existed (to plan the batch), which briefly made two Roadmap links dangling mid-implementation — resolved by finishing both in the same pass, but worth noting: `available: true` in curriculum.js is a promise that gets made good on immediately, not sequenced loosely.
- **Scope note:** only 2 of the 7 newly-planned simulations (Ransomware, Fake Wi-Fi — the two already-established Should-have items) were built in this pass, not all 7. Smishing, Business Email Compromise, Vishing, Baiting/Quid Pro Quo, and Tailgating remain steps 9–13, still to come — building and genuinely self-testing 7 new simulations in one pass wasn't realistic without sacrificing quality, and that tradeoff was made explicitly rather than silently.

**Smishing + Business Email Compromise simulations (Steps 9–10, completed 2026-08-28, batch-implemented):**
- Second batch pair, same proven scene-transition/keyboard/reduced-motion pattern as Ransomware and Fake Wi-Fi. Both promoted from Nice-to-have to Should-have per the widened scope (see SIMULATION-SCOPE-RESEARCH.md); both `curriculum.js` entries flipped from `available: false` to `true` only once the pages actually existed, learning from the earlier dangling-link lesson from Steps 7–8.
- Smishing uses a made-up delivery brand ("SwiftParcel") rather than a real courier, matching the fictional-brand pattern already established for Phishing ("SecurePay"). Business Email Compromise deliberately **reuses "Meridian Bookkeeping"** from the Ransomware simulation (same fictional CEO, same real vs. lookalike domain pair) rather than a new fictional company — consistent, connected fictional world across the small-business-focused simulations instead of a fresh cast each time.
- Applied the whitespace-collapse lesson proactively this time: swept both files for the exact bug pattern (text ending a line immediately before an inline `<span>`/`<code>` starting the next line) *before* any screenshot review, not after. Found and fixed one real instance in Smishing ("within24 hours") using the same technique as the previous three times; Business Email Compromise had none. Confirms the pattern-search approach (not just eyeballing screenshots) reliably catches this class of bug now.
- Full self-test battery (rapid-click race, keyboard pill activation + `aria-current`, reduced-motion, mobile overflow at 375px, progress-tracking via `progress-store.js`, zero console errors) run against both before considering them done — same rigor as the first batch, not relaxed just because the code pattern was already proven.
- Remaining Simulations-section items: Vishing, Baiting/Quid Pro Quo, Tailgating (steps 11–13) — not attempted in this pass either, for the same reasoning logged in the Steps 7–8 notes above.

**Vishing + Baiting + Tailgating simulations (Steps 11–13, completed 2026-08-28, batch-implemented) — Simulations section now fully complete:**
- Third and final batch of the widened-scope simulations, same proven pattern as the previous two batches. This completes **all 8 planned simulations** (Phishing, Ransomware, Fake Wi-Fi, Smishing, Business Email Compromise, Vishing, Baiting, Tailgating) — the Simulations site section is now fully done before moving to Quizzes, per the explicit "finish one section before the next" instruction.
- Continuity choices: Baiting continues the "Meridian Bookkeeping" fictional company from Ransomware/BEC (its foothold scene deliberately echoes Ransomware's "Foothold" scene, since baiting is a delivery method for the same kind of payload). Vishing introduces a new fictional bank ("First Meridian Bank") rather than reusing Meridian Bookkeeping, since it's a personal/consumer scenario rather than a workplace one. Tailgating is intentionally the simplest of the three (Level 1, no technical prerequisite) and is framed as a reminder that physical security matters as much as the digital attacks covered everywhere else on the site.
- Applied the whitespace-collapse check proactively to all three files before any screenshot review (now standard practice after three prior real occurrences) — found zero new instances this time, a sign the "keep text and inline tags on the same line" habit is holding from the start rather than needing after-the-fact fixes.
- Caught and fixed one unrelated real mistake during self-review: Tailgating's intro paragraph had an incomplete sentence ("just by being polite to.") left over from editing — not a code bug, but exactly the kind of thing a rigorous pass should catch before calling content finished.
- Same full self-test battery run against all three (rapid-click race, keyboard pill activation + `aria-current`, reduced-motion, mobile overflow, progress-tracking, zero console errors) — all passed cleanly on the first attempt for all three, no fixes needed post-test this time.
- `curriculum.js` and the Simulations hub both updated — every one of the 8 simulations is now `available: true` in both places, kept in sync as required by the CLAUDE.md rule added after Steps 7–8's dangling-link lesson.
- **Next section per the instruction: Quizzes (Build Order steps 14–23)** — one quiz per simulation above, plus the quiz-only topics (Pretexting, Credential reuse, Third-party risk) that don't have a matching simulation.

**Real bug: hub pages weren't actually reading from curriculum.js (found by the user, 2026-08-28, after Steps 11–13):**
- The user reported Ransomware and Fake Wi-Fi still showing "Coming soon" on `/simulations/` despite both being built and tested days earlier. My own verification at the time only grepped the page for the *word* "Ransomware" appearing anywhere — which matched the "Coming soon" card text too, so it looked "confirmed" without actually checking which visual state it was in. That was a real gap in how thoroughly I'd verified it, not just bad luck.
- Root cause: `src/pages/simulations/index.astro`, `src/pages/tools/index.astro`, and `src/pages/quizzes/index.astro` each kept their **own separate, hand-maintained `available` list** — despite `curriculum.js` already being documented (PLAN.md Section 6, CLAUDE.md) as "the single source of truth." The two were never actually wired together, so updating one didn't update the other. This wasn't a one-off typo: the same investigation found the **Tools hub also showing URL Checker as "Coming soon"** even though it's been live since Step 4, and the **Quizzes hub listing 4 quiz titles that didn't even match the real planned quizzes** in curriculum.js (it had "MFA & Passwords" as a title; curriculum.js had never planned a quiz by that name).
- While fixing it, also found `curriculum.js` itself was incomplete — it was missing quiz entries entirely for 7 of the 8 simulations (Ransomware, Fake Wi-Fi, Smishing, BEC, Vishing, Baiting, Tailgating all lacked a corresponding `quiz-*` entry, even marked unavailable), and had no `description` field despite the hub pages needing one per item.
- **Real fix, not a patch:** added `description` to every `CURRICULUM_ITEMS` entry, added the 7 missing quiz entries (all `available: false`, matching Build Order steps 14–20), and rewrote all three hub pages to render `itemsByType("simulation"|"tool"|"quiz")` directly from `curriculum.js` instead of maintaining separate arrays. There is now exactly one place that decides what's live — this class of bug can't recur because there's no second list left to fall out of sync.
- Verified properly this time: wrote a script that parses each hub page's actual rendered HTML and reports "LIVE LINK" vs. "COMING SOON" per item (not just text-presence grep) — confirmed all 8 simulations, all 3 built tools, and only the 1 built quiz now correctly show as live, with everything else correctly showing "Coming soon."
- **Lesson logged in CLAUDE.md:** "the text appears on the page" is not verification that a feature is in the state it's supposed to be in — check the actual rendered state (link vs. disabled/placeholder), not just presence of a string.

**Ransomware, Fake Wi-Fi, and Smishing quizzes (Steps 14–16, completed 2026-08-28, batch-implemented):**
- First Quizzes-section batch, made much lower-risk than the Simulations batches by the reusable `quiz-engine.js` from Step 6 — each new quiz page is the same proven shell markup plus a new question JSON and a one-line `createQuiz({ root, questions, itemId })` call, no new interactive logic to write or test.
- 5 questions per quiz, each reinforcing red flags already taught in that topic's simulation (e.g. the Ransomware quiz's "what does ransomware do before encrypting files?" question directly echoes the simulation's "Foothold" scene) rather than introducing disconnected trivia.
- Verified correctness of the answer keys themselves, not just that the engine renders: a test script answered every question with the *intended* correct option and confirmed a 5/5 result for all three — if a `correctOptionId` in the JSON didn't match what the explanation text actually described, this would have caught it.
- Given the real bug found earlier the same day (hub pages not reflecting `curriculum.js`), also did a **real-click verification from the Quizzes hub** this time, not just checking the HTML — clicked each new quiz's card and confirmed it actually lands on the right page. `curriculum.js` was updated for all three (`available: true`); since the hubs now render directly from it (see the bug-fix note above), no separate hub-page edit was needed this time.
- Remaining Quizzes-section items: Business Email Compromise, Vishing, Baiting, Tailgating, Pretexting, Credential Reuse, and Third-Party Risk quizzes (steps 17–23) — 7 more quizzes, not attempted in this pass for the same reasoning logged in prior batch notes (quality/testing over raw speed).

**Business Email Compromise, Vishing, Baiting, and Tailgating quizzes (Steps 17–20, completed 2026-08-28, batch-implemented):**
- Second Quizzes-section batch, all 4 remaining quizzes matching already-built simulations — completes quizzes for every one of the 8 simulations. Same low-risk pattern as the first quiz batch (proven engine + shell, only content is new).
- Same rigor applied: answer-key verification (every quiz scored 5/5 when answered with its own `correctOptionId`s), progress-tracking confirmed with score recorded, zero console errors, and real-click navigation from the Quizzes hub confirmed for all four (not just checking the HTML contains the right text).
- `curriculum.js` updated (`available: true` for all four); hub pages needed no separate edit since they render directly from it.
- Remaining Quizzes-section items: Pretexting, Credential Reuse, and Third-Party Risk (steps 21–23) — these three are quiz-only topics with no matching simulation, so they need freshly-written scenario content rather than reinforcing an existing walkthrough.

**Pretexting, Credential Reuse, and Third-Party Risk quizzes (Steps 21–23, completed 2026-08-28, batch-implemented) — Quizzes section now fully complete:**
- Final Quizzes-section batch. These three had no matching simulation to reinforce, so the questions are freshly-written scenarios rather than callbacks — grounded in the same cited evidence as the rest of the widened scope (credential abuse as the #1 initial attack vector, rising third-party/vendor involvement in breaches, the pretexting taxonomy from SIMULATION-SCOPE-RESEARCH.md).
- This completes **all 10 planned quizzes** and, with them, the entire Quizzes site section — matching the Simulations section's completion earlier the same day, per the "finish one section before the next" instruction.
- Same full rigor as every batch before it: answer-key verification via automated correct-answer runs (5/5 on all three), progress-tracking confirmed, zero console errors, and real-click verification from the Quizzes hub (not just HTML inspection).
- Ran one additional site-wide check this time given the earlier hub-sync bug: confirmed via the Roadmap page that exactly one item remains marked "Coming soon" across the *entire* site — the MFA Simulator (step 24) — meaning `curriculum.js` is now fully consistent with reality for all 23 completed Build Order items, not just the ones just touched.
- **Next per the Build Order: Tools completion + Progress Tracking (steps 24–26)** — the MFA/2FA simulator (with an MFA-fatigue scenario), the credential-reuse enhancement to the Password Strength tool, and the full "My Progress" page building on the `progress-store.js` foundation already in place.

**MFA/2FA Simulator (Step 24, completed 2026-08-29) — first item of the Tools completion + Progress Tracking mini-section:**
- New files: `src/data/mfa-methods.js` (content for 4 MFA methods: SMS, Authenticator App, Push Notification, Hardware Key/Passkey — each with how-it-works steps, a security-level rating, and a real, named attack against it) and `src/pages/tools/mfa-simulator.astro` (tab-based UI to browse the 4 methods, plus an interactive MFA-fatigue ("push bombing") demo scoped to the Push Notification tab: 5 simulated login-approval prompts, Deny/Approve, pass/fail summary).
- Self-caught code-quality fix before testing: the tab-switching logic first used fragile `className.replace(searchString, replaceString)` string manipulation; replaced with the same `classList.remove(...) / classList.add(...)` pattern already proven in the simulation pages' step-pill code, for consistency and robustness.
- Full self-test battery run via Puppeteer (Chrome, headless): 4-tab initial state, tab switching (aria-selected, active/inactive classes, panel visibility, focus moving to the new panel's heading), keyboard activation (Enter key), all 4 security-level badges showing correct text, the fatigue demo run twice (deny all 5 → green pass message; approve 1 of 5 → red fail message), reduced-motion load, 375px mobile width with no horizontal overflow, and zero console errors. One test assertion initially read as a "FAIL" but was a bug in the *test script* itself (it checked the wrong key path) — the underlying `progress-store.js` data (`{"completed":{"tool-mfa-simulator":{...}}}`) was correct on inspection; no product bug.
- Verified real-click navigation from the Tools hub (not just HTML text presence) confirms the MFA Simulator card shows a live link with no "Coming soon" badge.
- Flipped `available: false → true` for `tool-mfa-simulator` in `curriculum.js` only after the above testing passed — hub pages need no separate edit since they now derive from `curriculum.js` (per the Step 11-13 architecture fix).
- `npm run build` confirms a clean production build (28 static pages, including `/tools/mfa-simulator/index.html`, no errors).
- **Next: Step 25**, a credential-reuse/credential-stuffing enhancement to the existing Password Strength tool.

**Credential Reuse Check (Step 25, completed 2026-08-29) — second item of the Tools completion + Progress Tracking mini-section:**
- New file: `src/lib/credential-reuse-analyzer.js` — pure logic, decoupled from UI per the standing rule. Takes a list of `{ id, label, password }` practice accounts and returns exact-match reuse groups (identical password used on 2+ accounts) and similar-match reuse groups (same base password with only a trailing number/symbol/year changed, e.g. `SummerFun23!` vs `SummerFun24!` — the single most common real-world reuse tweak).
- Added a "Credential Reuse Check" section to the existing `src/pages/tools/password-strength.astro` page, below the single-password analyzer: a dynamic, add/remove-able list of account rows (label + password), seeded with 2 starter rows so the feature is obvious immediately, capped at 6 rows, with a page-level "Show/hide passwords" toggle. Results update live as you type, with an `aria-live` announcement and color-coded panels (red for exact reuse, amber for tweaked-variation reuse, green for no reuse detected).
- Deliberately does **not** claim to check real breach databases — this stayed within the static/no-network-calls architecture, and the "no reuse detected" message explicitly says the tool can only compare what you typed against itself, not real leaked-password lists, so it doesn't overstate what an offline tool can promise.
- No new curriculum entry needed — this extends the existing `tool-password-strength` item, and already calls `markCompleted("tool-password-strength")` the same way the original analyzer does.
- Full self-test battery via Puppeteer, 15/15 passed: regression check that the original single-password analyzer still works unchanged, starter rows seeded correctly, exact-reuse detection, similar/tweaked-reuse detection, clean (no-reuse) state, add-account capping at 6 with the button disabling, remove-account down to a minimum of 1 with the button disabling, show/hide-passwords toggle, keyboard operability (Enter activates Add Account), progress-tracking, 375px mobile with no horizontal overflow, and zero console errors.
- One screenshot artifact investigated and ruled out as a non-issue: a floating icon strip (from Chrome's own native password-manager UI) appeared over the results text in an initial full-page screenshot. Confirmed via the automated `innerHTML` checks that the actual page content was correct; the artifact was specific to `fullPage: true` screenshot capture combined with viewport-resize compositing, not a bug in the page. Retook with a tall fixed viewport and no resize step — confirmed the results panel text renders correctly and completely.
- `npm run build` confirms a clean production build (28 static pages, no errors).
- **Next: Step 26**, the full "My Progress" journey/progress-tracking page, building on the `progress-store.js` foundation already in place (localStorage tracking of tool/simulation/quiz completions).

**"My Progress" journey/progress-tracking page (Step 26, completed 2026-08-29) — final item of the Tools completion + Progress Tracking mini-section, and of the Should-have journey-review request from 2026-08-28:**
- New page: `src/pages/progress/index.astro`, reading only from the already-existing `progress-store.js` and `curriculum.js` — no new storage schema, exactly as planned when those two files were built ahead of this step. Shows: an empty state for a fresh visitor with a "Start with the Roadmap" call to action; an overall progress bar; a by-type breakdown (Simulations/Tools/Quizzes counts); a by-domain breakdown (progress bar per one of the 5 domains, turning green at 100%); and a full activity log sorted most-recent-first, showing each completed item's title, type, domain, completion date, and — for quizzes — the score recorded by `quiz-engine.js`.
- Added a "Reset progress" button, gated behind a confirm dialog (irreversible from the visitor's side, so it double-checks first) — calls the existing `resetProgress()` from `progress-store.js`.
- Added "My Progress" to the site nav (`src/components/Nav.astro`), between Quizzes and Report a Real One.
- Added inline "&#10003; Completed" badges to the Simulations, Tools, and Quizzes hub cards (`src/pages/{simulations,tools,quizzes}/index.astro`) — a small client-side script on each hub checks `isCompleted(item.id)` and reveals the badge, matching the existing progressive-enhancement pattern (badge hidden by default in the server-rendered HTML, only shown once JS actually runs and confirms completion).
- **Real bug found and fixed, not new but pre-existing:** while testing the nav's `aria-current="page"` highlighting on `/progress` (no trailing slash), found that the *same* bug already existed on every other nav link, including Roadmap — `Nav.astro`'s current-page check compared the raw pathname against hrefs that always end in `/`, so visiting any page without a trailing slash silently failed to highlight it in the nav. Confirmed via raw HTML inspection (not just visual check) that this predated today's change. Fixed by normalizing trailing slashes before comparison in `Nav.astro`, benefiting every page on the site, not just the new one.
- Full self-test battery via Puppeteer, 18/18 passed (after the nav fix — 17/18 before it): empty state for a fresh visitor; completed 3 real items by actually using their pages (typed a password, opened the MFA simulator, answered all 5 Phishing quiz questions) rather than faking localStorage, then confirmed all 3 show correctly in the activity log with the right titles, the quiz's score, and a non-zero overall progress bar; by-type and by-domain breakdowns reflect the real counts; inline "Completed" badges appear on the Tools and Quizzes hubs for the done items and not for untouched ones; nav highlights "My Progress" correctly; reset button is keyboard-focusable, actually clears everything when confirmed, and leaves data untouched when the confirm dialog is cancelled; 375px mobile with no horizontal overflow; zero console errors.
- One screenshot investigation, same lesson as Step 25: an icon overlay from Chrome's own UI appeared in an early capture; confirmed via DOM inspection this was a capture artifact, not a page bug, before moving on.
- `npm run build` confirms a clean production build (29 static pages now, including `/progress/index.html`, no errors).
- **This completes Build Order steps 24–26 (Tools completion + Progress Tracking) and the entire Should-have "journey/progress tracking" request from 2026-08-28.** Every curriculum item is now `available: true` and every simulation, tool, and quiz calls `markCompleted`. **Next per the Build Order: Section "Remaining" (steps 27–28)** — the Report-a-real-one checklist + About page, then the final accessibility/mobile QA and nice-to-have polish pass (including the dark/light theme toggle from Section 4).

**Report-a-real-one checklist + About page (Step 27, completed 2026-08-29) — first item of the "Remaining" section:**
- New page: `src/pages/report-a-real-one/index.astro` — a practical, real-incident checklist (not a simulation, and deliberately not registered in `curriculum.js`/`progress-store.js`, since it's a reference tool someone reaches for during an actual incident, not graded curriculum content). Five grouped sections using `<fieldset>`/`<legend>` for accessible grouping: "Right now," "If you already clicked, downloaded, or entered something," "Verify," "Report it," and "Afterwards" — 14 concrete, real checkbox items total, with a live "X of 14 steps checked off" counter and progress bar. Two items cross-link to the Password Strength tool's Credential Reuse Check and to the MFA Simulator, so someone mid-incident can jump straight to action instead of just reading advice.
- Content deliberately avoided inventing anything: the general advice (don't interact further, verify independently, change reused passwords, report through official channels) is standard, widely-known incident response practice; the named reporting bodies (FTC/reportfraud.ftc.gov, FBI IC3/ic3.gov, UK Action Fraud) are real, well-established public services, not fabricated.
- New page: `src/pages/about/index.astro` — covers what the site is (including the capability-measurement framing from the 2026-08-28 scope pivot), why it's built this way (cites the same evidence base as `SIMULATION-SCOPE-RESEARCH.md`: Verizon DBIR, MITRE ATT&CK, OWASP Top 10, CompTIA Security+ domains — described in prose rather than linked, since that research file isn't a served route and a dead link would repeat the exact "verify actual rendered state" mistake this project already learned from), an explicit "No data is ever collected" section naming every tool that analyzes locally, and an "Educational use only" note about the fictional brands used across simulations.
- Both pages added to `src/components/Nav.astro` (already present in the nav array from earlier work, but the routes themselves didn't exist until now — confirmed they'd have 404'd before this step).
- **Self-caught bug before testing:** one checklist item had leftover garbled text from an editing pass ("Turned on multi-factor authentication isn't already on for that account, turn it on now") — caught on a re-read of the file before running any tests, fixed to read correctly. **Second self-caught issue:** the two tool cross-links (to Password Strength and MFA Simulator) were initially written as plain text mentioning the tool by name with no actual `<a href>` — defeats the point of a checklist meant to get someone to the right tool fast during a real incident. Fixed using Astro's `set:html` on the two specific static, developer-authored strings (safe here since there's no user input involved) to render real anchor tags.
- Full self-test battery via Puppeteer, 14/14 passed: checklist starts at 0 checked with no garbled text; checkboxes respond to both real clicks and keyboard (Space); the counter increments and decrements correctly; every `<label>` is correctly wired to its checkbox via `for`/`id`; the 5 sections use proper `fieldset`/`legend` grouping; the two cross-links resolve to real `href`s; both pages have no horizontal overflow at 375px; real-click navigation confirmed from the footer ("No data is ever collected." → About) and from the nav (→ Report a Real One), not just checking the HTML contains the right text; zero console errors.
- `npm run build` confirms a clean production build (31 static pages now, including `/about/index.html` and `/report-a-real-one/index.html`, no errors).
- **Next: Step 28**, the final section — accessibility/mobile QA pass and nice-to-have polish (dark/light theme toggle from Section 4). This is the last item in the Build Order.

**Dark/light theme toggle + site-wide accessibility pass (Step 28, completed 2026-08-29) — final Build Order item:**
- **Theme toggle:** `src/styles/main.css` now defines a light palette as an override on top of the original dark palette (dark stays the default/base `@theme` tokens, so anyone with no saved preference and no OS preference still sees exactly the design that's been built and screenshotted all project — the override applies via `prefers-color-scheme: light` or an explicit `[data-theme]` attribute, whichever is more specific). A tiny inline `is:inline` script in `BaseLayout.astro`'s `<head>` applies any saved choice from `localStorage` (`cyberaware:theme`) before first paint, preventing a flash of the wrong theme. `Nav.astro` gained a real toggle `<button>` (inside the nav list, so it's reachable both in the mobile hamburger menu and inline on desktop) that flips between the two, persists the choice, and updates its own label/`aria-pressed` state — matching the existing toggle-button convention already used by the Show/Hide password buttons elsewhere on the site.
- Before building the toggle, grepped the entire `src/` tree for hardcoded colors (`bg-white`, `text-slate-*`, etc.) outside the CSS custom-property system, to check whether the rest of the site would "just work" under a second palette. Found exactly one file (`phishing.astro`) with hardcoded colors, all of them the intentional, fixed "SecurePay" fictional-brand mockup styling — correctly meant to stay constant regardless of site theme, so left alone (except for one real bug found in the process — see below).
- **Full site-wide automated accessibility audit** using axe-core (installed in the scratchpad, run headlessly against every one of the 31 pages in both dark and light theme — 62 audits total) rather than spot-checking a handful by eye, since the theme toggle newly introduced an entire second color palette that had never been contrast-checked. Found and fixed three real, distinct issues, all pre-existing or newly-introduced by the palette, not by any prior simulation/quiz/tool work:
  1. **Links inside body text distinguishable by color alone** (WCAG 1.4.1) — the footer's "No data is ever collected." link, plus the inline cross-links added in this session's About and Report-a-real-one pages, used `hover:underline` (underline only on hover) instead of a permanent visual cue. Fixed by making these links permanently underlined; this single fix in `Footer.astro` alone cleared the violation from every page site-wide, since the footer renders everywhere.
  2. **Quiz progress bar missing an accessible name** — `quiz-engine.js` sets `role="progressbar"` dynamically but never gave it an `aria-label`/`aria-labelledby`, so a screen reader would announce it as an unnamed progress indicator on all 10 quizzes. Fixed by wiring `aria-labelledby="quiz-progress"` to the existing visible "Question X of Y" text, matching the pattern the Password Strength tool's own strength bar already used correctly.
  3. **Color contrast failures specific to the new light theme** — three related bugs, all in `phishing.astro`'s fake-email mockup: (a) a hardcoded light-lavender brand text color (`#c4b5fd`, chosen for legibility against the site's original all-dark background) went nearly illegible against the new light theme's pale backgrounds — fixed by switching it to the theme-aware `--color-text` token, which adapts correctly in both themes, and applied proactively to all matching instances across all 6 scenes, not just the one axe's single-scene DOM snapshot happened to catch (the other 5 scenes are hidden by JS at scan time, so axe couldn't see them — reasoned through this rather than trusting the tool's silence as proof of absence); (b) `--color-warning`'s light-theme shade (`#b45309`) was darkened to `#92400e` after measuring it fell just short of 4.5:1 against its own 10%-opacity tinted background; (c) `--color-danger`'s light-theme shade needed two rounds of darkening (`#dc2626` → `#b91c1c` → `#991b1b`) before clearing 4.5:1 against its own 20%-opacity tinted background specifically (a same-hue tint-behind-text combination is mathematically harder to clear than text against a neutral surface, which is why this rule only fired for that one construction and not the many other places `--color-danger` is used against plain surface backgrounds). Verified empirically via repeated axe re-runs after each change rather than trusting hand-calculated contrast math alone.
- Full self-test battery via Puppeteer for the toggle itself, 13/13 passed: correct default theme under both dark- and light-preferring systems with no saved choice; clicking the toggle switches themes and persists to `localStorage`; an explicit saved choice correctly overrides the system preference on reload; the theme persists across navigation to a different page; toggling also updates the `color-scheme` CSS property (native form-control theming); the FOUC-prevention script is present and a fresh page load already has the correct `data-theme` at `domcontentloaded`, before any visible paint; keyboard-operable (Enter activates it); reduced motion still honored; reachable inside the mobile hamburger menu with no horizontal overflow at 375px; zero console errors.
- Final full axe-core sweep re-run after all fixes: **0 violations across all 31 pages in both themes (62/62 clean)**.
- Also checked off the long-standing Must-have checkbox "Reduced-motion mode + keyboard navigation baseline" in Section 4 — true since the very first simulation was built (Step 5) and re-verified in every single self-test battery run this entire project, but never actually checked off in PLAN.md until this final pass confirmed it holds site-wide, not just page-by-page.
- `npm run build` confirms a clean production build (31 static pages, no errors) after every fix in this step.
- **This completes the entire Build Order (Steps 1–28).** Every planned simulation, tool, and quiz is built, tested, and registered in `curriculum.js`; the Roadmap, My Progress, Report-a-real-one, and About pages are all live; the site now supports both a dark and a light theme with a verified-accessible contrast in each.

**Post-completion responsive-design bug (found 2026-08-29, same day as Step 28, in response to the user directly asking "is there a responsive design for this"):**
- Rather than answer from memory, ran a fresh multi-breakpoint check (320/375/768/1024/1440px) across 13 representative pages via Puppeteer — no horizontal overflow anywhere at any width, which was reassuring but not the full picture.
- Screenshots at each breakpoint caught a real layout bug that the overflow check alone couldn't: at the 768px tablet width, `Nav.astro`'s full nav list (7 links + the new theme toggle) switched on at Tailwind's `sm:` breakpoint (640px) but didn't have enough horizontal room yet, so "My Progress" and "Report a Real One" wrapped onto a second line, making the header uneven and cramped. Not broken (no scrollbar, nothing cut off), but a genuine visual-quality regression at exactly the width real tablets use.
- Confirmed via screenshot that 1024px was clean (everything fit on one line), so the fix was moving every `sm:` breakpoint in `Nav.astro` (the mobile toggle button, the nav list, and the theme-toggle button) to `lg:` (1024px) — the hamburger menu now covers the full mobile-through-tablet range, and the inline nav only appears once there's confirmed room for it.
- Verified with computed `display` values (not class-name presence, which Tailwind never actually removes/adds — a mistake caught in an early draft of the test script itself) at 375/768/1023/1024/1440px, plus a same-row check confirming all 7 nav items sit on a single row at the new 1024px breakpoint. All passed after the fix; re-ran `npm run build` to confirm no regressions.
- Also surfaced, and reported honestly rather than glossed over, two minor non-blocking observations from this pass: touch targets across the site are a consistent ~38px tall (common `px-3 py-2` padding), a little under the strict 44px accessibility guideline though still tappable; and several files never needed responsive (`sm:`/`md:`/`lg:`) classes at all, which is expected for single-column content pages under Tailwind's mobile-first model, not a gap.

**Post-completion nav restructure (2026-08-29, same day as the responsive-design fix above) — user-requested, not a Build Order item:**
- Two explicit requests: (1) remove the "Report a Real One" page entirely; (2) since the Roadmap page already surfaces every simulation/tool/quiz in one place, stop giving Simulations/Tools/Quizzes their own top-level nav links and instead group them under a single dropdown, opening on hover.
- **Removed:** `src/pages/report-a-real-one/index.astro` deleted outright (confirmed the route now 404s); removed its nav entry; confirmed via grep it was the only other reference in `src/` besides `Nav.astro` itself, so nothing else linked to it. The user gave no reason for the removal and none was invented for this log — Section 4's feature-list entry is kept but struck through with a pointer here, rather than deleted, so the history isn't lost.
- **Nav restructure:** `Nav.astro` now groups the header as Roadmap · **Explore** (hover/click dropdown: Simulations, Tools, Quizzes) · My Progress · About, plus the theme toggle. The "Explore" trigger is a real `<button>` (`aria-haspopup`, `aria-expanded`, `aria-controls`) that highlights as current whenever the visitor is anywhere under `/simulations/`, `/tools/`, or `/quizzes/`, not just on the hub pages themselves. On mobile it expands inline (indented) inside the existing hamburger menu rather than floating, since an absolutely-positioned dropdown doesn't make sense inside an already-vertical mobile menu; on `lg:` and up it's an absolutely-positioned floating panel.
- **Real interaction bug found and fixed before considering this done:** a naive "click toggles open/closed" handler combined with "hover opens" breaks for actual mouse users, because a real mouse click always fires `mouseenter` on the target immediately beforehand — so hover would open the menu, and the click's own toggle logic would then see it already open and instantly close it again. The button would appear to do nothing, or flash open then shut, for every real mouse click. Fixed by tracking whether the currently-open state came from hover or a deliberate activation (`openedViaHover` flag): a click that lands on an already-hover-opened menu now confirms it open (marks it as deliberately open) instead of closing it, while a genuine second click with no intervening hover still closes it correctly, and keyboard activation (Enter/Space, which never fires `mouseenter`) was unaffected either way. This is exactly the kind of subtle, mouse-vs-keyboard-vs-hover interaction bug that's easy to ship without noticing, since it only surfaces on a *second* real click and looks fine on the very first test — worth remembering for any future hover-triggered menu on this site.
- Self-test battery via Puppeteer, 16/16 real checks passed (one reported "FAIL" was the test's own intentional 404-confirmation request logging an expected console error, not a site bug): Report-a-real-one fully gone from nav and its route now 404s; menu starts closed; a script-triggered click (simulating assistive-tech activation) opens then closes it; a real mouse click (hover-then-click) leaves it open rather than flashing shut — the exact bug above, now fixed; hover opens and mouse-leave closes; Enter opens and Escape closes while returning focus to the trigger; Tab moves focus into the open menu and tabbing past its last item closes it; clicking outside closes it; the trigger highlights as current on a Tools sub-page; a real click through the dropdown lands on `/tools/`; the submenu expands correctly inline on mobile with no horizontal overflow.
- Also fixed two pieces of stale documentation found while updating this section: Section 3's site map and Section 6's folder structure had never been updated when `/roadmap/` (Step 11ish) and `/progress/` (Step 26) were actually built — both now listed.
- `npm run build` confirms a clean production build (30 static pages now that Report-a-real-one is gone, no errors).

**Arrow-key back/forward navigation (2026-08-29, same nav-restructure request):** the user also asked for arrow-key navigation "without using the browser's direction [buttons]." That phrasing had at least two real, very different readings — a keyboard shortcut for the browser's own back/forward, or stepping through the Roadmap's curriculum order — so this one **was** asked about via `AskUserQuestion` rather than assumed, since guessing wrong meant real rework and the two options had different technical risk. User chose plain browser back/forward.
- Added a single site-wide `keydown` listener in `BaseLayout.astro` (so it applies on every page, not just ones with a nav): plain `ArrowLeft` → `history.back()`, plain `ArrowRight` → `history.forward()`.
- Two real conflicts had to be designed around, both found by reading the existing code rather than assumed away:
  1. **Native form-control arrow-key behavior.** The quiz engine's answer options are real `<input type="radio">` elements (confirmed via `quiz-engine.js`), and radio *groups* natively use arrow keys to move the selection between options — a global back/forward shortcut would otherwise hijack every attempt to answer a quiz via keyboard. Text inputs (password field, MFA/credential-reuse account fields) need arrow keys for cursor movement for the same reason. Fixed with a direct guard: skip entirely when `event.target` is an `INPUT`/`TEXTAREA`/`SELECT`/`contenteditable` element.
  2. **The simulations' own scoped scene-stepping arrow keys** (Step 5, `phishing.astro` and every simulation since) already listen for `ArrowLeft`/`ArrowRight` when focus is within the walkthrough, and call `event.preventDefault()` when they act. A neutral tag/type guard wouldn't catch this case, since the focused element there is a `<button>` (a step pill or Prev/Next), not a form control. Fixed by deferring the back/forward decision with `setTimeout(..., 0)` and checking `event.defaultPrevented` before acting — this lets any more specific on-page handler claim the key first, regardless of which of the two listeners happened to attach first. No changes needed to any of the 8 existing simulation files.
- Self-test battery via Puppeteer, 11/11 real checks passed: ArrowLeft/ArrowRight correctly move backward/forward through real multi-page history; focused on a quiz's radio input, arrow keys move the radio selection and do *not* navigate away; focused on a text input, arrow keys move the cursor and do *not* navigate away; inside a simulation walkthrough, ArrowRight correctly advances the simulation's own scene (to "Step 2 of 6") and does *not* also trigger browser navigation; Shift+ArrowLeft (a modifier held) does nothing, confirming only the plain key triggers the shortcut; a plain ArrowLeft still works as the fallback afterward, confirming the guards don't over-trigger and swallow legitimate uses. (One console message showed up in the dev-only test run — the Astro dev server's own HMR WebSocket disconnecting when a page enters the browser's back-forward cache during history navigation — which doesn't exist in a production build at all, so not a real issue.)
- `npm run build` confirms a clean production build (still 30 pages, no errors) after this change.

**Landing page CTA restructure (2026-08-29, same session):** the user asked for a single "Start Your Journey" primary call-to-action pointing at `/roadmap/`, with the previous pair of buttons ("Start a simulation" → `/simulations/`, "Try a tool" → `/tools/`) moved down the page instead of removed. Implemented in `src/pages/index.astro`: the hero section now has exactly one accent-colored button ("Start Your Journey" → `/roadmap/`); the original two buttons now sit as a secondary CTA row directly below the "Explore by threat" card grid, in the same styling as before. Self-test battery via Puppeteer, 7/7 passed: hero has exactly one link and it's correct; both secondary CTAs present with correct hrefs; secondary CTAs confirmed (via `compareDocumentPosition`) to render after the threat grid, not before; real clicks on both the primary and a secondary CTA land on the right pages; no mobile overflow; zero console errors. `npm run build` clean (30 pages).

**Explore dropdown: closed itself before a click could land (found by the user, 2026-08-29, same day the dropdown was built):** real, reproducible bug in the hover-dropdown added earlier the same day — hovering "Explore" opened the menu, but moving the mouse down toward one of the three links closed it again before a click could register.
- Root cause: the dropdown `<ul>` had an unconditional `mt-1` (4px margin-top), and at desktop widths sits `lg:absolute lg:top-full` under the toggle button. `position: relative` on the parent `<li>` doesn't extend that `<li>`'s own hit-test box to cover an absolutely-positioned descendant, so the `<li>`'s rendered box only covered the button itself — the 4px margin created a literal dead zone between the button's bottom edge and the dropdown's top edge where the cursor was over *nothing* belonging to the `<li>`. Crossing that zone fired `mouseleave` on the wrapper and closed the menu, exactly as the user described ("before i pick something it just disappears").
- Fix, two parts: (1) removed the margin-based gap — the spacing users see is now `lg:pt-2` (padding, *inside* the dropdown's own box) instead of `lg:mt-1` (margin, *outside* it), so the dropdown's hit-test area now starts flush against the button with zero gap; (2) added a short (250ms) delay before `mouseleave` actually closes the menu, cancelled if the mouse re-enters within that window — the standard, defense-in-depth pattern real production dropdowns use, since even a zero-gap layout can have edge cases (a fast or diagonal mouse path briefly leaving the hit area). Click-outside, `Escape`, and focus-leaving-the-group still close it immediately — only the hover-based close got the grace period, since only hover has this gap-crossing failure mode.
- Self-test battery via Puppeteer, 7/7 passed: measured the actual rendered gap between button and dropdown at 0px; a realistic *stepped* mouse path (not a single instant jump, which wouldn't have caught the original bug) from the button down into a menu item keeps the menu open the whole way, and a real click at the end successfully navigates; moving the mouse fully away still closes the menu after the grace delay; re-hovering within the grace window cancels the pending close; the mobile inline (click-based, no hover) version is unaffected; zero console errors. `npm run build` clean (30 pages).
- Updated the standing `Nav.astro` dropdown note in CLAUDE.md/AGENTS.md to include this gap/grace-period lesson alongside the click-vs-hover toggle lesson from when the dropdown was first built, so both are captured together for any future hover menu on this site.

**Mobile nav toggle: hamburger icon (2026-08-29, user request):** the mobile "Menu" button was plain text; replaced with a standard 3-line hamburger icon (inline SVG, `stroke="currentColor"` so it's theme-aware automatically, no new CSS variable needed) that swaps to an X when the menu is open, mirroring the icon-swap pattern already used by the theme toggle. Since the visible text is gone, an `aria-label` ("Open menu" / "Close menu", updated on toggle) carries the same information for screen readers that `aria-expanded` alone wouldn't. Self-test battery via Puppeteer, 7/7 passed: correct initial hamburger icon/label/aria-expanded; click opens the menu and swaps to the X icon with updated label; a second click reverts both the icon and the menu; keyboard Enter activates it; hidden at desktop width as before; zero console errors. `npm run build` clean (30 pages).

**Dev environment note (found during Step 4, Phase 3):** the dev server binding only to the IPv6 loopback (`::1`) instead of all interfaces caused a real "404 in the user's browser, 200 from every tool-driven check" mismatch — the automated checks and the person's own browser were resolving `localhost` to different addresses. Fixed by always starting with `astro dev --background --host` (binds to `0.0.0.0`). See the updated Development section in CLAUDE.md/AGENTS.md.

## 8. Notes for Claude Code

- Read this file at the start of a session before making structural changes.
- Work through Section 5 (Build Order) sequentially — do not implement multiple features in parallel.
- After finishing a feature, run the local dev server and verify it works in-browser before moving to the next item.
- Keep detection/analysis logic in `src/lib/` decoupled from UI components.
- No network calls, no data persistence beyond optional local-storage, unless an Open Decision above is resolved to change that.
- Update the checkboxes in Sections 4 and 5 as features are completed, and log any changed decision in Section 7 or the relevant table.

**Build process (adopted starting Step 4, applies to all remaining Build Order items):**
Each item is split into 4 reviewed phases instead of being built and reported all at once:
1. **Skeleton** — structure/layout only, placeholder content, no real logic. Dev server running, given a URL and specific things to look at. Wait for go-ahead.
2. **Styling** — real theme/colors/typography/spacing applied to the skeleton. Wait for go-ahead.
3. **Logic/Interactivity** — real functionality wired up, self-tested in-browser first, then specific manual steps given for the user to verify. Wait for confirmation.
4. **Polish** — accessibility (keyboard nav, reduced-motion) and mobile-viewport pass for that feature specifically. Only after this is approved does the item get checked off in Sections 4/5.
Phases are never combined into one message. Trivial/static items may propose a shorter split instead of forcing all 4. Anything a phase reveals that should change Section 5 or 7 gets flagged before continuing, not folded in silently.

**Explainer PDF (adopted starting Step 5):** after each Build Order item is fully complete (Phase 4 approved, checkbox checked), produce a short PDF that breaks down the components built in that step in very plain, simple language ("explain it like I'm 6") — what each piece is and does, without jargon. Saved in the project root alongside the code.
