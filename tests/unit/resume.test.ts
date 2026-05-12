import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { runMigrations } from '../../src/main/db/migrate';
import * as schema from '../../src/main/db/schema';
import { createProject } from '../../src/main/db/projects';
import { getResume, saveResume } from '../../src/main/db/resume';
import { Resume, DEFAULT_RESUME } from '../../src/shared/resume';

function loadMigrations() {
  const dir = path.join(__dirname, '../../src/main/db/migrations');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((name) => ({ name, sql: fs.readFileSync(path.join(dir, name), 'utf8') }));
}

describe('resume repo', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeEach(() => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    runMigrations(sqlite, loadMigrations());
    db = drizzle(sqlite, { schema });
  });

  afterEach(() => {
    sqlite.close();
  });

  it('gets a resume for a project', () => {
    const p = createProject(db, { name: 'Test' });
    // @ts-expect-error - drizzle types can be complex in tests
    const resume = getResume(db, p.id);
    expect(resume.schemaVersion).toBe(1);
    expect(resume.basics.fullName).toBe('');
  });

  it('saves and retrieves a resume', () => {
    const p = createProject(db, { name: 'Test' });
    const newResume: Resume = {
      ...DEFAULT_RESUME,
      basics: {
        fullName: 'John Doe',
        headline: 'Software Engineer',
        links: [],
      },
      summary: 'Experienced developer',
    };

    // @ts-expect-error - drizzle types can be complex in tests
    saveResume(db, p.id, newResume);
    // @ts-expect-error - drizzle types can be complex in tests
    const retrieved = getResume(db, p.id);

    expect(retrieved.basics.fullName).toBe('John Doe');
    expect(retrieved.summary).toBe('Experienced developer');
    
    // Check if denormalized columns are updated
    const doc = sqlite
      .prepare('SELECT full_name, headline FROM resume_documents WHERE project_id = ?')
      .get(p.id) as { full_name: string; headline: string };
    expect(doc.full_name).toBe('John Doe');
    expect(doc.headline).toBe('Software Engineer');
  });

  it('returns default resume if row is missing (safety check)', () => {
    // @ts-expect-error - drizzle types can be complex in tests
    const resume = getResume(db, 'non-existent-id');
    expect(resume).toEqual(DEFAULT_RESUME);
  });
});
