import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    templateId: text('template_id').notNull().default('classic'),
    notes: text('notes'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => ({
    updatedAtIdx: index('idx_projects_updated_at').on(t.updatedAt),
  }),
);

export const resumeDocuments = sqliteTable('resume_documents', {
  projectId: text('project_id')
    .primaryKey()
    .references(() => projects.id, { onDelete: 'cascade' }),
  data: text('data').notNull(),
  fullName: text('full_name'),
  headline: text('headline'),
  updatedAt: integer('updated_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const providerConfigs = sqliteTable('provider_configs', {
  providerId: text('provider_id').primaryKey(),
  enabled: integer('enabled').notNull().default(0),
  baseUrl: text('base_url'),
  defaultModel: text('default_model'),
  extraJson: text('extra_json'),
  updatedAt: integer('updated_at').notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type ResumeDocumentRow = typeof resumeDocuments.$inferSelect;
