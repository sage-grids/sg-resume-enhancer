import { z } from 'zod';
import { Resume } from './resume';

export const ProjectId = z.string().uuid();

export const Project = z.object({
  id: z.string(),
  name: z.string(),
  templateId: z.string(),
  notes: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Project = z.infer<typeof Project>;

export const ProjectCreateInput = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  templateId: z.string().optional(),
  resume: Resume.optional(),
});
export type ProjectCreateInput = z.infer<typeof ProjectCreateInput>;

export const ProjectRenameInput = z.object({
  id: ProjectId,
  name: z.string().min(1).max(120),
});
export type ProjectRenameInput = z.infer<typeof ProjectRenameInput>;

export const ProjectIdInput = z.object({ id: ProjectId });
export type ProjectIdInput = z.infer<typeof ProjectIdInput>;

export const ProjectUpdateTemplateInput = z.object({
  id: ProjectId,
  templateId: z.string(),
});
export type ProjectUpdateTemplateInput = z.infer<typeof ProjectUpdateTemplateInput>;
