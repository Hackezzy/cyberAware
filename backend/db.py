"""
MySQL database setup and connection helper.

Uses mysql-connector-python (the official MySQL driver for Python) to talk
to a real MySQL server process -- a full database server, not a single
embedded file. Every query anywhere in this backend uses "%s" placeholders
(mysql-connector's parameter marker -- different from SQLite's "?"), never
Python string formatting/concatenation, to build SQL with request data.
That's what actually prevents SQL injection.

Unlike SQLite, this doesn't create itself out of nothing: a MySQL *server*
has to already be installed and running, reachable with the credentials in
.env, before this file can do anything. See backend/README.md for
installing MySQL and setting those up. Once the server is running, the
`cyberaware` database and its tables ARE created automatically on first
run (see init_db()) -- you don't need to create them by hand.
"""

import os

import mysql.connector

MYSQL_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "localhost"),
    "port": int(os.environ.get("MYSQL_PORT", "3306")),
    "user": os.environ.get("MYSQL_USER", "root"),
    "password": os.environ.get("MYSQL_PASSWORD", ""),
}
# This one identifier is built with an f-string, not a "%s" placeholder --
# that's not a contradiction of the rule above. MySQL only lets you
# parameterize *values* (a username, a score) with placeholders, never
# *identifiers* like a database name, and DB_NAME comes from this
# project's own .env config, never from a visitor's request, so there's no
# untrusted input reaching this string at all.
DB_NAME = os.environ.get("MYSQL_DATABASE", "cyberaware")

SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item_id VARCHAR(100) NOT NULL,
        completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,
        score INT NULL,
        total INT NULL,
        UNIQUE KEY unique_user_item (user_id, item_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """,
]


def get_connection():
    """Opens a new connection for a single request, already pointed at
    the cyberaware database. cursor(dictionary=True) is used everywhere
    this connection is read from, so rows come back as dicts (row["x"]),
    the same shape the earlier SQLite version's sqlite3.Row gave."""
    return mysql.connector.connect(database=DB_NAME, **MYSQL_CONFIG)


def init_db():
    """Creates the database and tables if they don't exist yet. Safe to
    call every time the app starts -- CREATE ... IF NOT EXISTS is a no-op
    once they're already there."""
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
    conn.commit()
    cursor.close()
    conn.close()

    conn = get_connection()
    cursor = conn.cursor()
    for statement in SCHEMA_STATEMENTS:
        cursor.execute(statement)
    conn.commit()
    cursor.close()
    conn.close()
