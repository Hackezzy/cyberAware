"""
CyberAware backend — real URL threat-intelligence checking.

Why this exists: the original URL Checker tool only ever looked at the
*shape* of a URL (structure, lookalike domains, etc.) entirely inside the
browser, with no network calls at all. That's a heuristic, not a real
threat check. This backend adds one small, focused job: take a URL from
the frontend, ask Google Safe Browsing (a real, continuously-updated
threat database) whether it's a known-malicious site, and return a real
verdict.

Why this has to be a backend, not just more browser JavaScript: it needs
an API key, and an API key in browser-visible code is not a secret — it
would show up in the page's own source the moment someone opens dev
tools. Keeping the key here, in a server-side environment variable,
is the entire reason this file exists instead of just another function
in src/lib/.
"""

import os

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()  # reads GOOGLE_SAFE_BROWSING_API_KEY from a local .env file

app = Flask(__name__)
CORS(app)  # the frontend runs on a different origin, so it needs this to be allowed to call us

GOOGLE_SAFE_BROWSING_API_KEY = os.environ.get("GOOGLE_SAFE_BROWSING_API_KEY")
SAFE_BROWSING_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"

# The threat categories we ask Google to check for. "SOCIAL_ENGINEERING" is
# Google's name for phishing — tricking someone into giving up information
# or installing something, rather than exploiting a technical flaw.
THREAT_TYPES = [
    "MALWARE",
    "SOCIAL_ENGINEERING",
    "UNWANTED_SOFTWARE",
    "POTENTIALLY_HARMFUL_APPLICATION",
]


@app.route("/api/check-url", methods=["POST"])
def check_url():
    data = request.get_json(silent=True) or {}
    url_to_check = (data.get("url") or "").strip()

    if not url_to_check:
        return jsonify({"error": "Missing 'url' in request body"}), 400

    if not GOOGLE_SAFE_BROWSING_API_KEY:
        return jsonify({
            "error": "Server has no Google Safe Browsing API key configured yet. "
                     "See backend/README.md to set one up."
        }), 503

    payload = {
        "client": {"clientId": "cyberaware", "clientVersion": "1.0.0"},
        "threatInfo": {
            "threatTypes": THREAT_TYPES,
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url_to_check}],
        },
    }

    try:
        response = requests.post(
            SAFE_BROWSING_URL,
            params={"key": GOOGLE_SAFE_BROWSING_API_KEY},
            json=payload,
            timeout=5,
        )
        response.raise_for_status()
    except requests.RequestException as error:
        return jsonify({"error": f"Could not reach Google Safe Browsing: {error}"}), 502

    result = response.json()
    matches = result.get("matches", [])

    return jsonify({
        "url": url_to_check,
        "isFlagged": len(matches) > 0,
        "threatTypes": sorted({match.get("threatType") for match in matches}),
        "source": "Google Safe Browsing",
    })


@app.route("/api/health", methods=["GET"])
def health():
    """Lets the frontend (or a developer in a browser tab) confirm the
    backend is actually running and whether a real API key is loaded,
    without needing to spend an API call to find out."""
    return jsonify({
        "status": "ok",
        "apiKeyConfigured": bool(GOOGLE_SAFE_BROWSING_API_KEY),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
