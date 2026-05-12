# 02 — Database schema & migrations

**Milestone:** M1
**Owner:** TBD
**Status:** Pending

## Goal

Local SQLite store for projects, résumé content, settings, and provider configs, with a forward-only migration runner that executes on app startup.

## Schema (v1)

```sql
-- 0001_init.sql

CREATE TABLE projects (
  id            TEXT PRIMARY KEY,           -- uuid v4
  name          TEXT NOT NULL,
  template_id   TEXT NOT NULL DEFAULT 'classic',
  notes         TEXT,
  created_at    INTEGER NOT NULL,           -- unix ms
  updated_at    INTEGER NOT NULL
);

CREATE TABLE resume_documents (
  project_id    TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  data          TEXT NOT NULL,              -- JSON, validated against shared Zod schema
  full_name     TEXT,                       -- denormalized for list/search
  headline      TEXT,                       -- denormalized for list/search
  updated_at    INTEGER NOT NULL
);

CREATE TABLE settings (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL               -- JSON string
);

CREATE TABLE provider_configs (
  provider_id   TEXT PRIMARY KEY,           -- 'ollama' | 'openrouter' | 'google' | 'openai'
  enabled       INTEGER NOT NULL DEFAULT 0,
  base_url      TEXT,
  default_model TEXT,
  extra_json    TEXT,                       -- provider-specific JSON
  updated_at    INTEGER NOT NULL
);

CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);
```

API keys are **not stored here**. They live in `safeStorage`-encrypted blobs keyed by `secret:{provider_id}:apiKey` inside the `settings` table.

## Migration runner

- SQL files in `src/main/db/migrations/NNNN_name.sql`.
- A `_migrations` table tracks applied filenames.
- Runner executes pending migrations in a single transaction on app startup; aborts launch on failure with a user-visible error dialog.
- WAL mode enabled (`PRAGMA journal_mode = WAL;`) for safer concurrent reads during long AI calls.

## Drizzle setup

- Drizzle schema mirrors the SQL (for type-safe queries), but DDL lives in raw `.sql` files so we control migration order. Don't use `drizzle-kit push` against the user's DB at runtime.

## Acceptance

- Fresh launch creates the DB at `app.getPath('userData')/sg-resume.db` and applies all migrations.
- Re-launch is a no-op (no migrations re-run).
- Unit test: insert + read for each table.
- Unit test: migration runner is idempotent.
