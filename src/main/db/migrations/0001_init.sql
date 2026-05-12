CREATE TABLE projects (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  template_id   TEXT NOT NULL DEFAULT 'classic',
  notes         TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE resume_documents (
  project_id    TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  data          TEXT NOT NULL,
  full_name     TEXT,
  headline      TEXT,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE settings (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL
);

CREATE TABLE provider_configs (
  provider_id   TEXT PRIMARY KEY,
  enabled       INTEGER NOT NULL DEFAULT 0,
  base_url      TEXT,
  default_model TEXT,
  extra_json    TEXT,
  updated_at    INTEGER NOT NULL
);

CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);
