import type Database from 'better-sqlite3';

export interface Migration {
  name: string;
  sql: string;
}

export function runMigrations(db: Database.Database, migrations: Migration[]): string[] {
  db.exec(
    `CREATE TABLE IF NOT EXISTS _migrations (
       name TEXT PRIMARY KEY,
       applied_at INTEGER NOT NULL
     );`,
  );

  const applied = new Set<string>(
    (db.prepare('SELECT name FROM _migrations').all() as { name: string }[]).map((r) => r.name),
  );

  const sorted = [...migrations].sort((a, b) => a.name.localeCompare(b.name));
  const pending = sorted.filter((m) => !applied.has(m.name));
  if (pending.length === 0) return [];

  const insert = db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)');
  const apply = db.transaction((toApply: Migration[]) => {
    for (const m of toApply) {
      db.exec(m.sql);
      insert.run(m.name, Date.now());
    }
  });

  apply(pending);
  return pending.map((m) => m.name);
}
