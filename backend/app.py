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

from dotenv import load_dotenv

# Must run before "from db import ..." below -- db.py reads MYSQL_* out of
# os.environ at import time to build its connection config, so .env has to
# already be loaded into the environment before that import happens. This
# was a real bug: db.py's MYSQL_CONFIG was silently getting the "" default
# for every value from .env, including the password, because this call
# used to come after the import instead of before it.
load_dotenv()

import mysql.connector
import requests
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

from db import get_connection, init_db

app = Flask(__name__)

app.secret_key = os.environ.get("SECRET_KEY")
if not app.secret_key:
    raise RuntimeError(
        "SECRET_KEY is not set. Add one to backend/.env — see backend/README.md "
        "for how to generate one. This key signs login sessions; without a real, "
        "stable one, logins would be either insecure or invalidated on every restart."
    )

# Login sessions are a signed cookie (Flask's built-in session, not a
# database-backed session store — fine at this scale since the only thing
# ever put in it is a user id, and the signature stops it being forged or
# tampered with, even though it isn't encrypted).
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,  # JS on the page can never read this cookie
    SESSION_COOKIE_SAMESITE="None",  # frontend (Netlify) and backend are different origins
    SESSION_COOKIE_SECURE=True,  # required alongside SameSite=None; Chrome treats
                                  # http://localhost as an exception, so this still
                                  # works for local testing, not just production HTTPS
)

# supports_credentials + an explicit origin allowlist (never "*") is required
# for cookies to be sent cross-origin at all. ALLOWED_ORIGINS in .env lets this
# be widened for a real deployment without editing code.
_allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS", "http://localhost:8080,https://cyberaware2.netlify.app"
).split(",")
CORS(app, supports_credentials=True, origins=_allowed_origins)

init_db()

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


# ============================================================
# Accounts + server-side progress tracking
#
# Logging in is optional, not required to use the site — every
# simulation/quiz/tool still works, and still tracks progress locally in
# the visitor's browser, exactly as before. Logging in additionally
# records that same progress here, under a real account, in a real MySQL
# database this project owns and controls (see db.py).
# ============================================================

def get_current_user():
    """Reads the logged-in user (if any) from the signed session cookie."""
    user_id = session.get("user_id")
    if not user_id:
        return None
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, username FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user


@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    # generate_password_hash salts and hashes the password (PBKDF2 by
    # default) -- the real password is never stored, only this hash. It's
    # not reversible, so even if the database leaked, the real passwords
    # wouldn't be exposed directly from it.
    password_hash = generate_password_hash(password)

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
            (username, password_hash),
        )
        conn.commit()
        user_id = cursor.lastrowid
    except mysql.connector.IntegrityError:
        # the UNIQUE constraint on username caught a duplicate
        cursor.close()
        conn.close()
        return jsonify({"error": "That username is already taken"}), 409
    cursor.close()
    conn.close()

    session["user_id"] = user_id
    session.permanent = True
    return jsonify({"id": user_id, "username": username}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, username, password_hash FROM users WHERE username = %s",
        (username,),
    )
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    # Deliberately the same generic error whether the username doesn't
    # exist or the password is wrong -- confirming "that username exists"
    # to a failed login attempt is its own small information leak.
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    session["user_id"] = user["id"]
    session.permanent = True
    return jsonify({"id": user["id"], "username": user["username"]})


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"status": "ok"})


@app.route("/api/auth/me", methods=["GET"])
def me():
    """Lets the frontend check on page load whether a visitor is already
    logged in (their session cookie is still valid), without them having
    to log in again every time they open a new page.

    Deliberately always 200, not 401 when logged out -- "not logged in
    yet" is the normal, expected result for most visitors on most page
    loads, not an error condition, and returning 401 for it made browsers
    log a spurious console error on every single page load for anyone not
    logged in. /api/progress's routes correctly stay 401 when logged out,
    since those really are protected actions being denied."""
    user = get_current_user()
    return jsonify(user) if user else jsonify(None)


@app.route("/api/progress", methods=["GET"])
def get_progress():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not logged in"}), 401
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT item_id, completed_at, score, total FROM progress WHERE user_id = %s",
        (user["id"],),
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    # completed_at comes back as a real Python datetime from MySQL, not a
    # string -- jsonify can't serialize that directly, so convert it here.
    for row in rows:
        row["completed_at"] = row["completed_at"].isoformat()
    return jsonify(rows)


@app.route("/api/progress", methods=["POST"])
def mark_progress():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json(silent=True) or {}
    item_id = (data.get("itemId") or "").strip()
    if not item_id:
        return jsonify({"error": "Missing itemId"}), 400
    score = data.get("score")
    total = data.get("total")

    conn = get_connection()
    cursor = conn.cursor()
    # One row per (user, item) -- completing the same quiz again updates
    # the existing row (new score, new timestamp) instead of duplicating
    # it, matching how the browser-local version already behaves. MySQL's
    # upsert syntax (ON DUPLICATE KEY UPDATE) is different from SQLite's
    # (ON CONFLICT ... DO UPDATE) -- this relies on the UNIQUE KEY on
    # (user_id, item_id) from db.py's schema.
    cursor.execute(
        """
        INSERT INTO progress (user_id, item_id, score, total)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            score = VALUES(score),
            total = VALUES(total),
            completed_at = CURRENT_TIMESTAMP
        """,
        (user["id"], item_id, score, total),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"status": "ok"}), 201


@app.route("/api/progress", methods=["DELETE"])
def reset_progress():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not logged in"}), 401
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM progress WHERE user_id = %s", (user["id"],))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
