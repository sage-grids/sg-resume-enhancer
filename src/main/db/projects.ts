import { randomUUID } from 'node:crypto';
import { eq, desc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { projects, resumeDocuments } from './schema';
import * as schema from './schema';
import type { Project, ProjectCreateInput, ProjectRenameInput } from '@shared/projects';

type DB = BetterSQLite3Database<typeof schema>;

const EMPTY_RESUME_JSON = JSON.stringify({
  schemaVersion: 1,
  basics: { fullName: '', links: [] },
  experience: [],
  education: [],
  skills: [],
});

function rowToProject(r: {
  id: string;
  name: string;
  templateId: string;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}): Project {
  return {
    id: r.id,
    name: r.name,
    templateId: r.templateId,
    notes: r.notes ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export class ProjectNotFoundError extends Error {
  constructor(id: string) {
    super(`Project ${id} not found`);
    this.name = 'ProjectNotFoundError';
  }
}

export function listProjects(db: DB): Project[] {
  const rows = db.select().from(projects).orderBy(desc(projects.updatedAt)).all();
  return rows.map(rowToProject);
}

export function getProject(db: DB, id: string): Project {
  const row = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!row) throw new ProjectNotFoundError(id);
  return rowToProject(row);
}

export function createProject(db: DB, input: ProjectCreateInput): Project {
  const now = Date.now();
  const id = randomUUID();
  const row = {
    id,
    name: input.name,
    templateId: input.templateId ?? 'classic',
    notes: null,
    createdAt: now,
    updatedAt: now,
  };

  db.transaction((tx) => {
    tx.insert(projects).values(row).run();
    tx.insert(resumeDocuments)
      .values({
        projectId: id,
        data: EMPTY_RESUME_JSON,
        fullName: null,
        headline: null,
        updatedAt: now,
      })
      .run();
  });

  return rowToProject(row);
}

export function renameProject(db: DB, input: ProjectRenameInput): Project {
  const now = Date.now();
  const updated = db
    .update(projects)
    .set({ name: input.name, updatedAt: now })
    .where(eq(projects.id, input.id))
    .returning()
    .get();
  if (!updated) throw new ProjectNotFoundError(input.id);
  return rowToProject(updated);
}

export function duplicateProject(db: DB, id: string): Project {
  const source = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!source) throw new ProjectNotFoundError(id);

  const sourceDoc = db
    .select()
    .from(resumeDocuments)
    .where(eq(resumeDocuments.projectId, id))
    .get();

  const now = Date.now();
  const newId = randomUUID();
  const newRow = {
    id: newId,
    name: `${source.name} (copy)`,
    templateId: source.templateId,
    notes: source.notes,
    createdAt: now,
    updatedAt: now,
  };

  db.transaction((tx) => {
    tx.insert(projects).values(newRow).run();
    tx.insert(resumeDocuments)
      .values({
        projectId: newId,
        data: sourceDoc?.data ?? EMPTY_RESUME_JSON,
        fullName: sourceDoc?.fullName ?? null,
        headline: sourceDoc?.headline ?? null,
        updatedAt: now,
      })
      .run();
  });

  return rowToProject(newRow);
}

export function deleteProject(db: DB, id: string): void {
  const result = db.delete(projects).where(eq(projects.id, id)).run();
  if (result.changes === 0) throw new ProjectNotFoundError(id);
}
