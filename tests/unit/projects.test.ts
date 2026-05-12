import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { runMigrations } from '../../src/main/db/migrate';
import * as schema from '../../src/main/db/schema';
import {
  createProject,
  deleteProject,
  duplicateProject,
  getProject,
  listProjects,
  renameProject,
  ProjectNotFoundError,
} from '../../src/main/db/projects';

function loadMigrations() {
  const dir = path.join(__dirname, '../../src/main/db/migrations');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((name) => ({ name, sql: fs.readFileSync(path.join(dir, name), 'utf8') }));
}

describe('projects repo', () => {
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

  it('creates a project and a paired resume_documents row', () => {
    const p = createProject(db, { name: 'My CV' });
    expect(p.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(p.name).toBe('My CV');
    expect(p.templateId).toBe('classic');

    const doc = sqlite
      .prepare('SELECT * FROM resume_documents WHERE project_id = ?')
      .get(p.id) as { project_id: string; data: string } | undefined;
    expect(doc).toBeDefined();
    expect(JSON.parse(doc!.data)).toMatchObject({ schemaVersion: 1 });
  });

  it('lists projects ordered by updatedAt desc', () => {
    const a = createProject(db, { name: 'A' });
    // Force a measurable gap so updatedAt differs.
    sqlite.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(a.updatedAt - 1000, a.id);
    const b = createProject(db, { name: 'B' });

    const list = listProjects(db);
    expect(list.map((p) => p.name)).toEqual([b.name, a.name]);
  });

  it('renames a project', () => {
    const p = createProject(db, { name: 'Old' });
    const renamed = renameProject(db, { id: p.id, name: 'New' });
    expect(renamed.name).toBe('New');
    expect(getProject(db, p.id).name).toBe('New');
  });

  it('duplicates a project including its résumé data', () => {
    const p = createProject(db, { name: 'Source' });
    sqlite
      .prepare('UPDATE resume_documents SET data = ?, full_name = ? WHERE project_id = ?')
      .run(JSON.stringify({ schemaVersion: 1, basics: { fullName: 'Jane' } }), 'Jane', p.id);

    const copy = duplicateProject(db, p.id);
    expect(copy.id).not.toBe(p.id);
    expect(copy.name).toBe('Source (copy)');

    const doc = sqlite
      .prepare('SELECT data, full_name FROM resume_documents WHERE project_id = ?')
      .get(copy.id) as { data: string; full_name: string };
    expect(doc.full_name).toBe('Jane');
    expect(JSON.parse(doc.data).basics.fullName).toBe('Jane');
  });

  it('deletes a project and cascades to resume_documents', () => {
    const p = createProject(db, { name: 'Doomed' });
    deleteProject(db, p.id);
    expect(listProjects(db)).toEqual([]);
    const doc = sqlite
      .prepare('SELECT * FROM resume_documents WHERE project_id = ?')
      .get(p.id);
    expect(doc).toBeUndefined();
  });

  it('throws ProjectNotFoundError for missing ids', () => {
    expect(() => getProject(db, 'nope')).toThrow(ProjectNotFoundError);
    expect(() => renameProject(db, { id: 'nope', name: 'X' })).toThrow(ProjectNotFoundError);
    expect(() => duplicateProject(db, 'nope')).toThrow(ProjectNotFoundError);
    expect(() => deleteProject(db, 'nope')).toThrow(ProjectNotFoundError);
  });
});
