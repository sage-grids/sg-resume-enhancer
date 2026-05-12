import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { settings } from './schema';

export function getSetting(db: BetterSQLite3Database, key: string): string | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row ? row.value : null;
}

export function setSetting(db: BetterSQLite3Database, key: string, value: string): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value },
    })
    .run();
}
