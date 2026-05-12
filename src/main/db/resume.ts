import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { resumeDocuments } from './schema';
import { Resume, DEFAULT_RESUME } from '@shared/resume';
import { logger } from '../logger';

export class ResumeNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Resume for project ${projectId} not found`);
    this.name = 'ResumeNotFoundError';
  }
}

export function getResume(db: BetterSQLite3Database, projectId: string): Resume {
  const row = db
    .select()
    .from(resumeDocuments)
    .where(eq(resumeDocuments.projectId, projectId))
    .get();

  if (!row) {
    // If it doesn't exist, it should have been created with the project.
    // But for safety, we return a default one.
    return DEFAULT_RESUME;
  }

  try {
    return JSON.parse(row.data) as Resume;
  } catch (e) {
    logger.error(`Failed to parse resume data for project ${projectId}`, e);
    return DEFAULT_RESUME;
  }
}

export function saveResume(
  db: BetterSQLite3Database,
  projectId: string,
  resume: Resume,
): void {
  const now = Date.now();
  
  db.insert(resumeDocuments)
    .values({
      projectId,
      data: JSON.stringify(resume),
      fullName: resume.basics.fullName || null,
      headline: resume.basics.headline || null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: resumeDocuments.projectId,
      set: {
        data: JSON.stringify(resume),
        fullName: resume.basics.fullName || null,
        headline: resume.basics.headline || null,
        updatedAt: now,
      },
    })
    .run();
}
