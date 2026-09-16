# CyberAware

An interactive cybersecurity awareness and skills platform — simulations, quizzes, and
analysis tools that teach people to recognize and respond to common cyber attacks by
actually doing it, not just reading about it.

## Project structure

```text
/
├── frontend/          Plain HTML/CSS/JS site — the entire live site, no build step
│   ├── css/           main.css (theme system) + components.css (all component styles)
│   ├── js/
│   │   ├── nav.js      shared nav/footer loader + all nav interactivity
│   │   └── lib/         framework-free logic: quiz/simulation engines, analyzers, curriculum data
│   ├── data/           quiz questions (JSON) and sample data for the tools
│   ├── partials/       shared nav.html / footer.html, fetched and injected at page load
│   ├── simulations/, quizzes/, tools/     one .html (+ .js where needed) per item
│   ├── public/          favicon — frontend/ is the deployed site root, so this lives here, not at repo root
│   ├── roadmap.html, progress.html, about.html, real-incidents.html, index.html
├── backend/            Small Flask API — the two deliberate exceptions to "fully static"
│   ├── app.py            /api/check-url (Google Safe Browsing) + /api/auth/*, /api/progress
│   └── db.py              PostgreSQL schema + connection helper (hosted on Supabase, hand-written SQL)
├── PLAN.md              Source of truth for scope, site map, build order, and decision log
└── netlify.toml         publish = "frontend" (no build command — it's already static files)
```

There is no build step. `frontend/` is served as-is. Two exceptions to "fully static": the
URL Safety Checker's real threat-intel check, and optional accounts + server-side progress
tracking (`frontend/login.html`) — both need a small server-side backend, see `backend/README.md`.
Logging in is never required; every simulation/quiz/tool works and tracks progress locally
either way.

## Running it locally

Frontend (from the `frontend/` directory, so paths resolve exactly as they will in
production):

```sh
py -m http.server 8080
```

Then open `http://localhost:8080/index.html`.

Backend (only needed to test the URL Checker's real API call — every other page works
without it):

```sh
cd backend
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
py app.py
```

See `backend/README.md` for how to get a Google Safe Browsing API key.

## Deployment

Netlify, configured via `netlify.toml`: no build command, publish directory `frontend/`.
