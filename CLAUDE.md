## Project

This is CyberAware, an interactive cybersecurity awareness platform. Its
purpose is two-layered: general public awareness *and* measuring/building
actual capability, closer to an entry-level cybersecurity skills gauge than
passive reading. See `SIMULATION-SCOPE-RESEARCH.md` (project root) for the
cited evidence behind that scope and the full topic list. **Read PLAN.md in
full before making structural changes** — it is the source of truth for
scope, site map, feature list, and build order, and is kept up to date as
decisions change (see its Section 7 and 8).

## Architecture (as of 2026-09-15)

The site was originally built in Astro + Tailwind. As of 2026-09-15 that has
been **fully replaced**: the entire site is now plain HTML/CSS/JS in
`frontend/`, with a small Python/Flask backend (`backend/`) as the one
deliberate exception. `src/`, `astro.config.mjs`, `package.json`,
`node_modules/`, and `tsconfig.json` are all gone — there is no build step,
no npm, no bundler. This was a direct, explicit user request, motivated by
the user wanting to personally read and understand every part of the
codebase (they know HTML/CSS and a bit of JS, not Astro/Tailwind).

- **`frontend/` is the deployed site root**, not a subdirectory. Every
  internal link, `<link>`, `<script src>`, and `fetch()` call uses a
  root-relative path (`/roadmap.html`, `/css/main.css`, `/js/nav.js`) —
  **never** a `/frontend/...`-prefixed path. This matters twice: it's what
  `netlify.toml`'s `publish = "frontend"` expects in production, and it's
  why local testing must serve `frontend/` itself as the HTTP root (see
  Development below), not the project root — serving from the project root
  silently "fixes" a `/frontend/`-prefixed bug that would then break in
  production. This exact mismatch was caught once already (2026-09-15): the
  whole site was originally built and tested with `/frontend/`-prefixed
  paths because local testing happened to be served from the project root,
  which worked by coincidence but would have 404'd everything the moment
  Netlify's publish directory switched to `frontend/`. Fixed by rewriting
  every path site-wide and moving `public/` (the favicon) into
  `frontend/public/`, then re-running the full regression suite with
  `frontend/` itself as the server root to prove it — don't reintroduce a
  `/frontend/` prefix anywhere.
- **The two deliberate exceptions to "fully static"**: (1) the URL Checker
  tool (`frontend/tools/url-checker.html`) calls the Flask backend
  (`backend/app.py`) for a live Google Safe Browsing lookup, because that
  requires a server-side API key that can't safely ship in browser JS; (2)
  optional accounts + server-side progress tracking (`frontend/login.html`,
  `frontend/js/lib/auth.js`, the backend's `/api/auth/*` and `/api/progress`
  routes, backed by a PostgreSQL database hosted on Supabase, in
  `backend/db.py` — no ORM, every query is hand-written parameterized SQL;
  Supabase just runs the Postgres server, it doesn't hide the SQL from you).
  Logging in is **never required** — every simulation/quiz/tool still
  works with no account, and still tracks progress in the visitor's own
  browser either way (`progress-store.js`); logging in additionally mirrors
  that same progress to a real account server-side. Both exceptions are
  narrow, not a general license — the Phishing Email Scanner stays
  heuristic/client-side-only on purpose (no honest free API exists for real
  email-content phishing classification), and every other tool/simulation/
  quiz makes no network calls beyond the optional progress sync. Ask before
  adding any *further* network dependency or expanding what login gates.
- **These two exceptions are independent of each other — keep it that way.**
  `app.py` calls `init_db()` at startup inside a `try/except` specifically
  so a database problem (Supabase unreachable, `DATABASE_URL` not set yet)
  only breaks `/api/auth/*`/`/api/progress`, never the rest of the app. A
  real bug shipped once where `init_db()` was unconditional and its
  exception crashed the entire Flask process at startup — meaning the URL
  Checker, which has nothing to do with the database, couldn't be tested at
  all just because Supabase wasn't configured yet. Don't make either
  exception a hard dependency for the other.
- No build step for the frontend: files are served as-is. `<script
  type="module">` + native `import`/`export` run directly in the browser;
  `fetch()` is used for loading JSON/partial content (chosen over `import
  ... with { type: "json" }` for broader compatibility).
- Shared markup (nav, footer) has no native reuse mechanism in plain HTML,
  so `frontend/js/nav.js` fetches `frontend/partials/{nav,footer}.html` and
  injects each via `mount.outerHTML = html` — meaning `#nav-mount` and
  `#footer-mount` **no longer exist in the DOM** once injection happens.
  Don't write a check (test script or otherwise) that expects those mount
  elements to still be present afterward — check for the real injected
  content (`.site-header`, `.site-footer`) instead. This exact mistake was
  made twice in this rebuild's own test scripts.
- Shared engines live in `frontend/js/lib/`: `quiz-engine.js`
  (`createQuiz({ root, questions, itemId })`), `sim-engine.js`
  (`createSimulation({ root, totalSteps, itemId })`), plus
  `progress-store.js`, `curriculum.js`, and the framework-free analyzers
  (`phishing-detector.js`, `password-analyzer.js`,
  `credential-reuse-analyzer.js`, `url-checker.js`). A new quiz or
  simulation page only needs its own scene/question content plus one call
  into the shared engine — don't duplicate the stepping/scoring logic
  inline.
- `frontend/js/lib/curriculum.js` is the single source of truth for every
  simulation/quiz/tool's domain, difficulty level, and `href`, read at
  **runtime** (not build time — there's no build step) by `roadmap.html`
  and `progress.html`, which build their entire DOM structure client-side
  from it. If you add a new simulation/quiz/tool, register it here and
  call `markCompleted(itemId)` from `progress-store.js` when it's finished
  (the quiz/sim engines already do this generically via their `itemId`
  option).
- **Progressive enhancement pattern**: every quiz/simulation's scene or
  question content is written directly into the page's static HTML and
  visible by default; the shared engine only hides non-current items once
  JS actually runs. A JS failure falls back to "show everything," never a
  blank page.
- Interactive controls that look clickable must be real `<button>`
  elements (or otherwise natively focusable), never a `<li>`/`<div>` with
  only a click handler.
- Reduced-motion support (`prefers-reduced-motion`) and keyboard
  navigation are built into the shared engines already — reuse them rather
  than re-adding this per page.

## Accounts and the PostgreSQL/Supabase backend

- **The database engine changed twice during this feature's build** —
  SQLite first, then MySQL (a hard user requirement at the time), then
  PostgreSQL hosted on Supabase (once the user clarified the real
  requirement was "you write the SQL yourself," not literally MySQL the
  engine). If you find stray references to MySQL or SQLite anywhere,
  they're leftover — Supabase/Postgres is current. Don't assume the choice
  is settled without checking `PLAN.md`'s latest entries first; it's moved
  before.
- **Uses `psycopg` (v3), not `psycopg2`.** `psycopg2-binary` has no
  prebuilt wheel for this project's Python version (3.14, very new) and
  fails to build from source without PostgreSQL dev headers installed —
  `psycopg[binary]` is the actively-maintained successor and had a working
  wheel immediately. The APIs are similar but not identical: dict-style
  rows use `conn.cursor(row_factory=psycopg.rows.dict_row)`, not a
  `cursor_factory=` argument; the exceptions module is `psycopg.errors`,
  same names (e.g. `UniqueViolation`) as psycopg2's had.
- **Requires a Supabase project already created**, with its connection
  string in `.env` as `DATABASE_URL` (a single `postgresql://...` URI, not
  separate host/port/user/password fields like the MySQL version had) —
  see `backend/README.md` for creating one. Unlike a self-hosted database,
  there's no "create the database" step: Supabase already provisions the
  database itself when the project is created, so `db.py`'s `init_db()`
  only needs to create the `users`/`progress` tables inside it.
- **Postgres has no `AUTO_INCREMENT`** (MySQL) or `AUTOINCREMENT` (SQLite)
  — it's `SERIAL` (or `GENERATED ALWAYS AS IDENTITY` in newer Postgres).
  No `ENGINE=InnoDB` either — Postgres only has one storage engine, so
  foreign keys work without picking one.
- **Postgres has no `cursor.lastrowid`** (MySQL's way of getting an
  auto-generated primary key back after an INSERT) — use `INSERT ...
  RETURNING id` and read it from `cursor.fetchone()` instead. This is why
  `register()`'s INSERT looks different from the equivalent MySQL version
  did.
- **Postgres's upsert syntax is `INSERT ... ON CONFLICT (cols) DO UPDATE
  SET col = EXCLUDED.col`** — different from MySQL's `ON DUPLICATE KEY
  UPDATE col = VALUES(col)` and from SQLite's `ON CONFLICT ... DO UPDATE
  SET col = excluded.col` (note: SQLite's `excluded` is lowercase and not
  a real keyword the way Postgres's `EXCLUDED` is). Used in
  `/api/progress`'s POST route. Don't copy upsert syntax between engines
  if this ever changes again.
- **Every SQL query anywhere in `backend/`** must use `%s` placeholders
  (both psycopg and the earlier mysql-connector use this marker — only
  SQLite's `?` is different), never Python string formatting/concatenation
  to build a query. That's what actually prevents SQL injection — verified
  early in this feature's build, against the SQLite version, by trying a
  `' OR '1'='1`-style login attempt against the real running server and
  confirming it just failed as an ordinary invalid login; the same
  parameterization discipline carries through every engine switch since.
- **`load_dotenv()` must run before `from db import ...`** in `app.py`,
  not after. `db.py` reads `DATABASE_URL` out of `os.environ` when
  `get_connection()` is called — if `.env` hasn't been loaded into the
  environment yet, that lookup silently returns `None` and `get_connection()`
  raises a clear `RuntimeError` (a real bug shipped once, against the
  MySQL version, where this exact ordering mistake instead produced a
  confusing "Access denied ... (using password: NO)" error that looked
  like a wrong password in `.env` when the password was actually correct —
  confirmed by testing `load_dotenv()` in isolation before concluding it
  was an import-order bug, not a credentials problem).
- **Passwords are hashed with `werkzeug.security.generate_password_hash`**
  (already a Flask dependency), never stored raw. If you ever need to
  verify this is actually happening, query the real value out of the
  `users.password_hash` column directly (via Supabase's dashboard SQL
  editor, or `psql`) — it should look like `scrypt:...`, never the
  plaintext password.
- **Login sessions are Flask's built-in signed-cookie session**, not a
  database-backed store — fine at this scale since the only thing ever put
  in it is a user id. `SECRET_KEY` is required from `.env` and the app
  refuses to start without one (see `backend/README.md` for generating a
  real one) — a missing or randomly-regenerated-per-restart key would mean
  either insecure sessions or everyone logged out on every restart.
- **CORS must stay `supports_credentials=True` with an explicit
  `ALLOWED_ORIGINS` allowlist**, never a wildcard `*` origin — cookies
  can't be sent cross-origin to a wildcard-CORS response at all, so this
  isn't a style preference, it's required for login to work. Session
  cookies use `SameSite=None; Secure; HttpOnly`; this was confirmed to
  actually work over plain `http://localhost` in a real Puppeteer-driven
  Chrome (not just assumed) — Chrome treats `localhost` as a secure-context
  exception, so this doesn't need real HTTPS for local testing, only in
  production.
- **`/api/auth/me` is deliberately always a 200** (`null` body when logged
  out), not 401. "Not logged in yet" is the normal, expected result of
  this specific check for most visitors on most page loads — returning
  401 for it made Chrome log a spurious console error on *every* page
  load for anyone not logged in, since browsers log any non-2xx fetch
  response as a console error regardless of whether the app handles it
  gracefully. `/api/progress`'s routes correctly stay 401 when logged out,
  since those really are protected actions being denied, not a routine
  status check. If you add another "check my state" style endpoint,
  apply the same reasoning — 401 for a genuinely denied action, 200 with
  a null/false payload for a routine check whose "no" answer is common and
  expected.
- **`progress-store.js`'s existing synchronous API never changed** —
  `markCompleted(itemId, meta)` still always writes to local storage
  first and every existing caller (`quiz-engine.js`, `sim-engine.js`,
  every tool) needed zero changes. It additionally fires an unawaited
  `pushProgress()` from `auth.js` if a user happens to be logged in
  (checked via a cached, once-per-page-load state, not a fresh network
  call on every single completion). Local storage stays the one thing
  every page (Roadmap, My Progress) actually reads from; the server is a
  second copy that follows it. Keep it this way — don't make any existing
  page read progress from the server directly, since that would make
  every one of those pages behave differently for logged-in vs. logged-out
  visitors for no real benefit.
- `nav.js` is a plain classic script (not `type="module"`) loaded
  identically on all pages, so it reaches into `auth.js`/`progress-store.js`
  via dynamic `import()` rather than a static top-level import — this
  avoided needing to add `type="module"` to 31+ existing `<script
  src="/js/nav.js">` tags just for this one feature. Any username or other
  visitor-supplied text rendered into the nav (or anywhere) via
  `innerHTML` must be HTML-escaped first — it's untrusted input from
  whoever registered it, not the page's own markup.

## Theming

The site supports dark and light themes (`frontend/css/main.css`, toggled
via `frontend/js/nav.js`, dark is the default/base palette, light is the
override via `prefers-color-scheme` or an explicit `data-theme` attribute
set by the toggle). **Always use the `--color-*` CSS custom properties**
(`var(--color-text)`, `var(--color-surface)`, etc.) for any new UI — never a
hardcoded hex — or it will silently break under whichever theme it wasn't
built in. The one legitimate exception is a fixed, in-universe fictional
brand color inside a simulation's mockup (e.g. "SecurePay"'s purple) that's
meant to look identical regardless of site theme. After any color-related
change, don't just eyeball one screenshot — run an axe-core contrast check
(Puppeteer, `runOnly: { type: "rule", values: ["color-contrast"] }` — not
the whole `cat.color` category, which also includes the stricter AAA
`color-contrast-enhanced` rule this site has never targeted) via a real
`#theme-toggle` click, not just `page.emulateMediaFeatures()`, since the
two paths can serve different values and only one of them is what a real
user clicking the toggle actually gets.

## Critical CSS gotcha: `[hidden]` vs. a class-based `display`

The browser's built-in `[hidden] { display: none }` and any class that sets
its own `display` (e.g. `.btn { display: inline-block }`) have **equal CSS
specificity** — since `components.css` loads after the browser's default
stylesheet, the class wins the tie, silently keeping a "hidden" element
visible. Fixed globally in `main.css` with
`[hidden] { display: none !important; }`. This is why every test for "is
this element hidden" in this codebase asserts the real
`getComputedStyle(el).display === "none"`, never just the JS `.hidden`
property — the property can be `true` while the browser still renders the
element, which is exactly how this bug shipped past testing once already.

## The Explore nav dropdown (`frontend/js/nav.js` / `components.css`)

Two historical bugs, both fixed, both easy to reintroduce if this pattern
gets reused elsewhere:

1. A naive click-to-toggle handler breaks when combined with hover-to-open,
   because a real mouse click fires `mouseenter` on its target immediately
   before `click` — so hover opens the menu first, and toggle logic then
   sees it already open and closes it again on the very click meant to use
   it. Only shows up on a real mouse click, not keyboard activation. Fix:
   track whether the current open state came from hover or a deliberate
   click/keydown, and have a click right after a hover-open *confirm* the
   open state instead of toggling it closed.
2. Any margin-based gap between the toggle button and an absolutely
   positioned dropdown panel creates a dead zone the mouse has to cross —
   `position: relative` on the parent doesn't extend its hit-test box to
   cover an absolutely positioned child, so `mouseleave` fires the instant
   the cursor crosses that gap. Use padding *inside* the dropdown's own box
   for visual spacing, never margin *outside* it, and give any hover-close
   a short (~250ms) cancellable delay as a safety net regardless.

## Global arrow-key back/forward navigation

`frontend/js/nav.js` has a site-wide `keydown` listener for plain
`ArrowLeft`/`ArrowRight` → `history.back()`/`forward()`. Any new global
keyboard shortcut needs the same two guards: (1) skip when `event.target`
is a form control (`INPUT`/`TEXTAREA`/`SELECT`/`contenteditable`); (2)
defer with `setTimeout(..., 0)` and check `event.defaultPrevented` before
acting, so a more specific handler already on the page (e.g. a
simulation's own scoped arrow-key scene stepping) gets to claim the key
first regardless of listener registration order.

## Verify actual rendered/computed state, not just that a flag was set

This lesson has shown up in at least four different forms in this project:
a hub page's `available` flag not reaching the actual link/badge shown; the
theme-toggle color path serving different values than
`emulateMediaFeatures()`; the `.hidden` property vs. computed `display`;
and a test checking `#nav-mount`/`#footer-mount` after they'd already been
replaced via `outerHTML`. When checking whether something is
visible/available/live, check the specific attribute, computed style, or
sibling markup that encodes that state — not a proxy for it.

## No dead links

Any nav item, hub card, or curriculum entry pointing at content that isn't
built yet gets a visibly disabled, dashed-border "not yet built" badge —
never a live-looking link to a 404. (As of 2026-09-15 every page is built,
so this shouldn't currently apply anywhere, but keep it in mind for any
future addition.)

## Full-site regression testing

Before any change that could affect site-wide structure (a shared partial,
`curriculum.js`, the CSS theme system, the path scheme), run a full crawl —
not spot-checks on the pages touched in one session. The established
pattern (Puppeteer + `puppeteer-core`, Chrome at
`C:/Program Files (x86)/Google/Chrome/Application/chrome.exe`): discover
every `.html` file under `frontend/` (excluding `partials/`), then for each
one check a real 200 status, a non-empty title, that nav/footer actually
injected, that every internal link and asset (`<link>`/`<script src>`)
resolves to a real file — checked via an in-page `fetch()`, not
`page.goto()`, since navigating directly to a raw `.js`/`.css` URL as a
top-level page load makes Chrome auto-request its own default favicon and
pollutes console-error capture with an unrelated 404 — plus no mobile
overflow at 375px and zero console errors. Accept both `200` and `304`
(Not Modified) as success for asset checks; a `304` on a cached repeat
request is normal, not a bug.

## Development

Static test server, run with `frontend/` itself as the working directory
(matching Netlify's actual publish root — see the Architecture section
above for why this specific detail matters):

```
cd frontend
py -m http.server 8080
```

Then open `http://localhost:8080/index.html`. Use `py`, not `python` — on
this machine `python` resolves to a non-functional Windows Store stub even
though a real Python install exists; `py` finds it correctly.

**Never stop a Python process with `taskkill /IM python.exe`** (or any
kill-by-image-name) — it kills every process with that name on the
machine, not just the one you started. Find the specific PID first:

```
netstat -ano | grep ":8080" | grep LISTENING
taskkill //F //PID <pid>
```

Backend (`backend/app.py`, Flask): only needed to test the URL Checker's
real API call — every other page works without it.

```
cd backend
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
py app.py
```

See `backend/README.md` for getting a real Google Safe Browsing API key.

## Documentation

- [Flask](https://flask.palletsprojects.com/)
- [Google Safe Browsing API](https://developers.google.com/safe-browsing)
