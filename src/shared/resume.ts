import { z } from 'zod';

export const Link = z.object({
  id: z.string(),
  label: z.string().min(1),
  url: z.string(),
});
export type Link = z.infer<typeof Link>;

export const ExperienceItem = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  location: z.string().optional(),
  startDate: z.string(),           // ISO YYYY-MM
  endDate: z.string().nullable(),  // null = present
  bullets: z.array(z.string()),
});
export type ExperienceItem = z.infer<typeof ExperienceItem>;

export const EducationItem = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  details: z.string().optional(),
});
export type EducationItem = z.infer<typeof EducationItem>;

export const SkillGroup = z.object({
  id: z.string(),
  category: z.string(),            // e.g., "Languages", "Frameworks"
  items: z.array(z.string()),
});
export type SkillGroup = z.infer<typeof SkillGroup>;

export const Resume = z.object({
  schemaVersion: z.literal(1),
  basics: z.object({
    fullName: z.string(),
    headline: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(Link).default([]),
  }),
  summary: z.string().optional(),
  experience: z.array(ExperienceItem).default([]),
  education: z.array(EducationItem).default([]),
  skills: z.array(SkillGroup).default([]),
  // Future-friendly: extensions namespace for v1.1+ fields.
  ext: z.record(z.string(), z.unknown()).optional(),
});
export type Resume = z.infer<typeof Resume>;

export const ResumeUpdateInput = z.object({
  projectId: z.string().uuid(),
  resume: Resume,
});
export type ResumeUpdateInput = z.infer<typeof ResumeUpdateInput>;

export const ResumeGetInput = z.object({
  projectId: z.string().uuid(),
});
export type ResumeGetInput = z.infer<typeof ResumeGetInput>;

export const DEFAULT_RESUME: Resume = {
  schemaVersion: 1,
  basics: {
    fullName: '',
    links: [],
  },
  experience: [],
  education: [],
  skills: [],
};
