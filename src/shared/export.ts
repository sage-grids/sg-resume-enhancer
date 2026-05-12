import { z } from 'zod';

export const ExportFormat = z.enum(['pdf', 'docx']);
export type ExportFormat = z.infer<typeof ExportFormat>;

export const PaperSize = z.enum(['Letter', 'A4']);
export type PaperSize = z.infer<typeof PaperSize>;

export const ExportInput = z.object({
  projectId: z.string().uuid(),
  format: ExportFormat,
  pageSize: PaperSize.default('Letter'),
});
export type ExportInput = z.infer<typeof ExportInput>;
