"""
PostgreSQL (hosted on Supabase) database setup and connection helper.

Uses psycopg (the current, actively-maintained PostgreSQL driver for
Python -- sometimes called "psycopg3"; the older "psycopg2" doesn't yet
ship prebuilt wheels for this project's Python version) to talk to a real
Postgres server -- Supabase just runs and manages that server for you; the
database itself is ordinary PostgreSQL, and every query anywhere in this
backend is still hand-written SQL, never hidden behind an ORM. Every query
uses "%s" placeholders, never Python string formatting/concatenation, to
build SQL with request data -- that's what actually prevents SQL injection.

Unlike a self-hosted database, Supabase already creates the database itself
for you when you create a project -- there's no "CREATE DATABASE" step
here. This file only needs to create the tables inside that
already-existing database, which init_db() does automatically on first run.

Requires DATABASE_URL in .env -- copy it from your Supabase project's
dashboard (Project Settings -> Database -> Connection string). See
backend/README.md for the exact steps.
"""

import os

import psycopg

SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id VARCHAR(100) NOT NULL,
        completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        score INTEGER,
        total INTEGER,
        UNIQUE (user_id, item_id)
    )
    """,
]


def get_connection():
    """Opens a new connection for a single request, using the full
    connection string from .env. row_factory=psycopg.rows.dict_row is
    passed everywhere this connection is read from, so rows come back as
    dicts (row["x"]), the same shape mysql-connector's dictionary=True
    gave in the earlier MySQL version."""
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is not set. Add it to backend/.env -- see "
            "backend/README.md for getting it from your Supabase project."
        )
    return psycopg.connect(database_url)


def init_db():
    """Creates the tables if they don't exist yet. Safe to call every time
    the app starts -- CREATE TABLE IF NOT EXISTS is a no-op once they're
    already there. Unlike the earlier MySQL version, there's no separate
    "create the database" step -- Supabase already provisioned that when
    the project was created."""
    conn = get_connection()
    cursor = conn.cursor()
    for statement in SCHEMA_STATEMENTS:
        cursor.execute(statement)
    conn.commit()
    cursor.close()
    conn.close()
