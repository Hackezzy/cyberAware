## Project

This is CyberAware, an interactive cybersecurity awareness platform. Its
purpose is two-layered: general public awareness *and* — as of 2026-08-28 —
measuring/building actual capability, closer to an entry-level cybersecurity
skills gauge than passive reading. See `SIMULATION-SCOPE-RESEARCH.md`
(project root) for the cited evidence behind that scope and the full topic
list. **Read PLAN.md in full before making structural changes** — it is the
source of truth for scope, site map, feature list, and build order, and is
kept up to date as decisions change (see its Section 7 and 8).

Key rules from PLAN.md, restated here so they aren't missed:

- Work through the Build Order (PLAN.md Section 5) sequentially, and
  **complete each site section (Simulations, then Quizzes, etc.) fully
  before moving to the next** rather than interleaving — this reverses an
  earlier "no parallel scaffolding" rule; within a section, *similar*
  items may be batch-implemented together in one pass (see the Ransomware +
  Fake Wi-Fi notes in Section 7) as long as each one still gets a real
  self-test pass, not just the first one.
- Before starting a new feature, confirm it matches the next unchecked
  item in Section 5.
- Keep detection/analysis logic (`phishing-detector`, `password-analyzer`,
  `url-checker`, etc.) in `src/lib/`, decoupled from UI components.
- Fully static, client-side-only site: no backend, no accounts, no
  network calls, no data persistence beyond optional local storage. Ask
  before implementing anything that would need more than that — "make it
  production-scalable" is *not* license to add a backend; it means
  well-structured, reusable code within this same static architecture.
- **Every new simulation, tool, or quiz must be registered in
  `src/data/curriculum.js`** (`CURRICULUM_ITEMS`) with a domain, a 1–5
  difficulty level, and a `description` (shown on hub cards), and should
  call `markCompleted(itemId)` from `src/lib/progress-store.js` when the
  user finishes it (the quiz engine does this generically via its `itemId`
  option — a new quiz doesn't need to add this itself). The Roadmap page
  (`/roadmap/`) **and** the three hub pages (`src/pages/{simulations,tools,quizzes}/index.astro`)
  all render `itemsByType(...)` from `curriculum.js` directly — none of
  them keep their own list. **Do not give a hub page its own hardcoded
  array again** — that exact mistake shipped for Ransomware, Fake Wi-Fi,
  and URL Checker (all built and working, but stuck showing "Coming soon"
  on their hub because a second, unsynced list existed) until the user
  caught it. `curriculum.js` really is the only place `available` is
  decided now; keep it that way.
- **Verify the actual rendered state, not just that text appears on the
  page.** A `grep` for a title matching means the word is somewhere on the
  page — it does not mean the item is live rather than shown as "Coming
  soon." This exact false-confidence check is what let the bug above ship
  undetected. When checking whether something is available/unlocked/live,
  check the specific attribute or sibling markup that encodes that state
  (an `href`, a disabled flag, a status label), not just word presence.
- After finishing a feature, run the dev server and verify it in-browser
  before moving on.
- After completing a feature, update the checkboxes in PLAN.md Sections 4
  and 5, and log any changed decisions in Section 7.
- Reduced-motion support and keyboard navigation are built in from the
  start for every interactive tool, not added later.
- Interactive controls that look clickable must be real `<button>`
  elements (or otherwise natively focusable), not `<li>`/`<div>` with only
  a click handler — this exact mistake has been made and caught twice
  (Phishing simulation's step pills, originally). Check for it before
  calling a feature done.
- Watch for Astro's whitespace-collapse behavior: a text node ending a
  line immediately before an inline element (`<span>`, `<code>`, `<a>`) on
  the *next* line loses its space in the compiled output, even though it
  reads fine as source. This has caused real, shipped bugs three separate
  times. Either keep the tag opening on the same line as the preceding
  word, or verify the rendered HTML (not just the source) for any inline
  element that follows text across a line break.
- The site supports both a dark and a light theme (`src/styles/main.css`,
  toggled via `Nav.astro`, dark is the default/base `@theme` palette, light
  is the override). **Always use the `--color-*` CSS custom properties**
  (`text-(--color-text)`, `bg-(--color-surface)`, etc.) for any new UI —
  never a raw Tailwind palette color (`text-slate-900`, `bg-white`) or a
  hardcoded hex — or it will silently break (usually illegibly) under
  whichever theme it wasn't built in. The one legitimate exception is a
  fixed, in-universe fictional-brand color inside a simulation's mockup
  (e.g. "SecurePay"'s purple) that's meant to look identical regardless of
  site theme — even then, prefer a solid, fully-opaque brand background
  with a fixed contrasting text color over a translucent tint layered on
  the theme's own surface, since a translucent tint's *effective* color
  still shifts with the theme underneath it and can silently fail contrast
  in one theme but not the other (found via axe-core in Step 28 — a
  hardcoded light-lavender brand text color was fine against the site's
  original all-dark background but nearly illegible once a light theme
  existed). After any color-related change, don't just eyeball one
  screenshot — run an automated contrast check (axe-core via Puppeteer is
  the pattern used in Step 28) across representative pages in **both**
  themes, since a contrast bug can affect only one theme and pass a
  same-theme-only visual check silently.
- The header nav (`Nav.astro`) has one hover-triggered dropdown ("Explore"
  → Simulations/Tools/Quizzes), added 2026-08-29. If another one gets
  added later: **a naive click-to-toggle handler breaks when combined with
  hover-to-open**, because a real mouse click always fires `mouseenter` on
  its target immediately before the `click` event — so hover opens the
  menu first, and toggle logic then sees it already open and instantly
  closes it again on the very click meant to use it. This only shows up on
  a real mouse click (not on keyboard activation, which never fires
  `mouseenter`), so it's easy to test with only the keyboard and ship it
  broken for mouse users. `Nav.astro`'s fix — track whether the current
  open state came from hover or a deliberate click/keydown, and have a
  click right after a hover-open *confirm* the open state instead of
  toggling it closed — is the pattern to reuse.
- That same dropdown had a second, separate bug (found by the user right
  after shipping): any margin-based gap between the toggle button and an
  absolutely-positioned dropdown panel creates a dead zone the mouse has
  to cross — `position: relative` on the parent doesn't extend its
  hit-test box to cover an absolutely-positioned child, so a `mouseleave`
  fires the instant the cursor crosses that gap, closing the menu before
  a click can land. Use padding *inside* the dropdown's own box for visual
  spacing, never margin *outside* it, and give any hover-close a short
  (~250ms) cancellable delay as a safety net regardless — don't rely on a
  zero-gap layout alone, since fast/diagonal mouse movement can still slip
  through. When testing a hover dropdown, move the mouse in several small
  steps toward an item and try to click it — a single instant jump won't
  reproduce this class of bug.
- `BaseLayout.astro` has a site-wide `keydown` listener for plain
  `ArrowLeft`/`ArrowRight` → `history.back()`/`forward()` (added
  2026-08-29). If you add another global keyboard shortcut, it needs the
  same two guards this one has: (1) skip when `event.target` is a form
  control (`INPUT`/`TEXTAREA`/`SELECT`/`contenteditable`) — arrow keys
  there mean cursor movement or, for the quiz engine's real
  `<input type="radio">` options, native radio-group navigation, not a
  page-level shortcut; (2) defer the action with `setTimeout(..., 0)` and
  check `event.defaultPrevented` before acting, so any more specific
  handler already on the page (e.g. a simulation's own scoped scene-
  stepping arrow keys) gets to claim the key first regardless of listener
  registration order. Skipping either guard silently breaks quiz-taking or
  simulation navigation for keyboard users — exactly the kind of bug that
  looks fine in a quick manual check and only shows up once you actually
  test the specific pages that already owned those keys.

## Development

When starting the dev server, use background mode with `--host` so it binds
to all network interfaces (0.0.0.0), not just the IPv6 loopback:

```
astro dev --background --host
```

Without `--host`, Astro/Node binds to `::1` (IPv6 loopback) only on this
machine — if a browser resolves `localhost` to `127.0.0.1` (IPv4) first, it
gets no response or an unrelated 404 instead of reaching this server. This
caused real confusion during Build Order step 4 (see PLAN.md Section 7).

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
