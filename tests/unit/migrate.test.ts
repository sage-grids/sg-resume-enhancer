import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../../src/main/db/migrate';

describe('runMigrations', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  const m1 = { name: '0001_init.sql', sql: 'CREATE TABLE a (id INTEGER PRIMARY KEY);' };
  const m2 = { name: '0002_add_b.sql', sql: 'CREATE TABLE b (id INTEGER PRIMARY KEY);' };

  it('applies pending migrations and records them', () => {
    const applied = runMigrations(db, [m1, m2]);
    expect(applied).toEqual(['0001_init.sql', '0002_add_b.sql']);
    const names = db
      .prepare('SELECT name FROM _migrations ORDER BY name')
      .all()
      .map((r) => (r as { name: string }).name);
    expect(names).toEqual(['0001_init.sql', '0002_add_b.sql']);
  });

  it('is idempotent — re-running applies nothing', () => {
    runMigrations(db, [m1, m2]);
    const second = runMigrations(db, [m1, m2]);
    expect(second).toEqual([]);
  });

  it('applies only newly-added migrations on a second run', () => {
    runMigrations(db, [m1]);
    const second = runMigrations(db, [m1, m2]);
    expect(second).toEqual(['0002_add_b.sql']);
  });

  it('applies migrations in lexicographic order regardless of input order', () => {
    const applied = runMigrations(db, [m2, m1]);
    expect(applied).toEqual(['0001_init.sql', '0002_add_b.sql']);
  });

  it('rolls back the whole batch if one migration fails', () => {
    const bad = { name: '0003_bad.sql', sql: 'NOT VALID SQL;' };
    expect(() => runMigrations(db, [m1, m2, bad])).toThrow();
    const names = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((r) => (r as { name: string }).name);
    expect(names).toContain('_migrations');
    expect(names).not.toContain('a');
    expect(names).not.toContain('b');
  });
});
