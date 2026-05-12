import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { runMigrations, type Migration } from './migrate';
import * as schema from './schema';
import { logger } from '../logger';

let _sqlite: Database.Database | null = null;
let _db: BetterSQLite3Database<typeof schema> | null = null;

export interface OpenDbOptions {
  filePath: string;
  migrations: Migration[];
}

export function openDb(opts: OpenDbOptions): {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
} {
  const sqlite = new Database(opts.filePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const applied = runMigrations(sqlite, opts.migrations);
  if (applied.length > 0) {
    logger.info(`db: applied migrations ${applied.join(', ')}`);
  }

  const db = drizzle(sqlite, { schema });
  _sqlite = sqlite;
  _db = db;
  return { db, sqlite };
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!_db) throw new Error('Database not initialized. Call openDb() first.');
  return _db;
}

export function closeDb(): void {
  if (_sqlite) {
    _sqlite.close();
    _sqlite = null;
    _db = null;
  }
}

/**
 * Loaded at build time by Vite — every .sql under db/migrations is inlined as a string.
 */
export function loadBundledMigrations(): Migration[] {
  const modules = import.meta.glob('./migrations/*.sql', {
    eager: true,
    query: '?raw',
    import: 'default',
  }) as Record<string, string>;
  return Object.entries(modules).map(([file, sql]) => ({
    name: file.replace(/^.*\//, ''),
    sql,
  }));
}
