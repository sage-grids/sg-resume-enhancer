# 04 — Résumé data model & structured editor

**Milestone:** M2
**Owner:** TBD
**Status:** Pending

## Goal

A single canonical résumé schema, shared by the editor, templates, DOCX exporter, and AI prompt builder.

## Schema sketch

```ts
// src/shared/resume.ts
import { z } from 'zod';

export const Link = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const ExperienceItem = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  location: z.string().optional(),
  startDate: z.string(),           // ISO YYYY-MM
  endDate: z.string().nullable(),  // null = present
  bullets: z.array(z.string()),
});

export const EducationItem = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  details: z.string().optional(),
});

export const SkillGroup = z.object({
  id: z.string(),
  category: z.string(),            // e.g., "Languages", "Frameworks"
  items: z.array(z.string()),
});

export const Resume = z.object({
  schemaVersion: z.literal(1),
  basics: z.object({
    fullName: z.string(),
    headline: z.string().optional(),
    email: z.string().email().optional(),
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
```

Stored as JSON in `resume_documents.data`. `full_name` and `headline` are denormalized into top-level columns for the project list.

## Editor UX (renderer)

- `react-hook-form` form per section, validated with the Zod schema (via `zodResolver`).
- Repeating items (experience, education, skills) use **dnd-kit** for drag-to-reorder.
- Each section autosaves 800ms after the last edit — `api.resume.save({ projectId, resume })` writes the whole document. (Whole-doc upsert keeps things simple; the JSON is small.)
- Status pill: `Editing → Saving… → Saved` with timestamp.

## Schema versioning

- `schemaVersion: 1` is mandatory. When we bump to 2, write a migration that loads each row, runs an in-place upgrade, and writes back. Never mutate the schema without bumping the version.

## Acceptance

- All PRD §5 editor flows work for at least Summary + Experience + Education + Skills + Links.
- Autosave round-trips through SQLite without losing focus.
- Reordering bullets within an experience item persists.
- Closing and reopening a project restores exact state including cursor-friendly fields.
