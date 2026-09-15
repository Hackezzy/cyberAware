# CyberAware backend

A small Flask API with two jobs:

1. Check a URL against Google Safe Browsing's live threat database and
   return a real verdict, instead of only the local structural heuristics
   the rest of the site uses. See the comment at the top of `app.py` for
   why this needs to be a backend at all (short version: an API key can't
   be kept secret in browser-visible code).
2. Optional accounts + server-side progress tracking. Nobody has to log in
   to use the site — every simulation/quiz/tool still tracks progress in
   the visitor's own browser either way — but logging in additionally
   records that same progress here, in a real MySQL database (see `db.py`
   for the schema). This needs a MySQL server already installed and
   running — see step 3 below.

## 1. Install Python dependencies

From this `backend/` folder:

```
pip install -r requirements.txt
```

## 2. Get a real Google Safe Browsing API key (you'll need to do this part)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
   and sign in (a normal Google account works).
2. Create a new project (any name, e.g. "cyberaware").
3. In the search bar, find **"Safe Browsing API"** and click **Enable**
   for your project.
4. Go to **APIs & Services → Credentials → Create Credentials → API key**.
   Copy the key it gives you.
5. (Recommended) Click into the new key and restrict it to only the
   Safe Browsing API, so it can't be used for anything else if it ever
   leaked.

The free tier covers 10,000 requests/day, which is far more than a demo
or a defense needs.

## 3. Install and start MySQL (you'll need to do this part)

Only needed for accounts/progress — the URL Checker's threat check works
without it.

Pick one:

- **MySQL Installer** (the official way): download from
  [dev.mysql.com/downloads/installer](https://dev.mysql.com/downloads/installer/),
  run it, choose "Server only" or the default "Developer Default" setup.
  It'll prompt you to set a **root password** — remember it, it goes in
  `.env` in the next step. It installs MySQL as a Windows service, so it
  starts automatically.
- **XAMPP** (simpler, bundles MySQL with a GUI control panel — a common
  choice if you haven't used MySQL before): download from
  [apachefriends.org](https://www.apachefriends.org/), install it, open
  the XAMPP Control Panel, and click **Start** next to MySQL. Its default
  root password is blank (leave `MYSQL_PASSWORD` empty in `.env`).

Either way, you don't need to create the `cyberaware` database or its
tables by hand — `db.py`'s `init_db()` creates both automatically the
first time `app.py` runs, using whichever account (`MYSQL_USER`) you
configure in `.env`.

## 4. Set the API key, session secret, and MySQL connection locally

Copy `.env.example` to a new file named `.env` in this same folder, and
fill in the real values:

```
GOOGLE_SAFE_BROWSING_API_KEY=your-real-key-here
SECRET_KEY=<output of the command below>
MYSQL_PASSWORD=<whatever you set in step 3>
```

Generate a real `SECRET_KEY` (this signs login session cookies — see
`.env.example` for why it needs to be random and stable, not left as the
placeholder):

```
py -c "import secrets; print(secrets.token_hex(32))"
```

`.env` is already excluded from git (see the root `.gitignore`) — never
commit any of these real values.

## 5. Run the server

```
py app.py
```

It starts on `http://localhost:5000`. On first run, it connects to your
MySQL server and creates the `cyberaware` database and its `users`/
`progress` tables if they don't exist yet — if this step fails, it's
almost always MySQL not actually running yet, or `MYSQL_PASSWORD` in
`.env` not matching what you set in step 3.

**Threat check:**
- `GET /api/health` — confirms the server is running and whether a key
  is loaded, without spending an API call. Visit it directly in a
  browser to check.
- `POST /api/check-url` — body `{"url": "https://example.com"}`, returns
  whether Google flags it and for what threat type(s).

**Accounts + progress** (all require the session cookie a successful
login sets — see `app.py`'s comments for how that cross-origin cookie is
configured):
- `POST /api/auth/register` — body `{"username": "...", "password": "..."}`
  (username 3+ chars, password 8+ chars), creates the account and logs
  in.
- `POST /api/auth/login` — same body shape, logs in an existing account.
- `POST /api/auth/logout` — clears the session.
- `GET /api/auth/me` — returns the logged-in user, or `null` (still a 200)
  if not logged in — see `app.py`'s comment on that route for why.
- `GET /api/progress` — the logged-in user's completed items.
- `POST /api/progress` — body `{"itemId": "...", "score": 4, "total": 5}`
  (`score`/`total` optional), records or updates a completion.
- `DELETE /api/progress` — clears the logged-in user's progress.

## Quick manual test (no frontend needed yet)

```
curl http://localhost:5000/api/health

curl -X POST http://localhost:5000/api/check-url \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://example.com\"}"
```

A known Google-provided test URL for confirming the *malicious* path
actually works end-to-end (this is a safe, intentional test URL Google
publishes for exactly this purpose, not a real threat):

```
curl -X POST http://localhost:5000/api/check-url \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://testsafebrowsing.appspot.com/s/malware.html\"}"
```

Accounts + progress (the `-c`/`-b cookies.txt` flags save and reuse the
session cookie across requests, same as a browser would):

```
curl -c cookies.txt -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"testuser\", \"password\": \"testpassword123\"}"

curl -b cookies.txt http://localhost:5000/api/auth/me

curl -b cookies.txt -X POST http://localhost:5000/api/progress \
  -H "Content-Type: application/json" \
  -d "{\"itemId\": \"sim-phishing\"}"

curl -b cookies.txt http://localhost:5000/api/progress
```
