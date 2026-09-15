# CyberAware backend

A small Flask API with one real job: check a URL against Google Safe
Browsing's live threat database and return a real verdict, instead of
only the local structural heuristics the rest of the site uses. See the
comment at the top of `app.py` for why this needs to be a backend at all
(short version: an API key can't be kept secret in browser-visible code).

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

## 3. Set the key locally

Copy `.env.example` to a new file named `.env` in this same folder, and
paste your real key in:

```
GOOGLE_SAFE_BROWSING_API_KEY=your-real-key-here
```

`.env` is already excluded from git (see the root `.gitignore`) — never
commit the real key.

## 4. Run the server

```
python app.py
```

It starts on `http://localhost:5000`. Two endpoints:

- `GET /api/health` — confirms the server is running and whether a key
  is loaded, without spending an API call. Visit it directly in a
  browser to check.
- `POST /api/check-url` — body `{"url": "https://example.com"}`, returns
  whether Google flags it and for what threat type(s).

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
