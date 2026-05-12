import { z } from 'zod';

export const TemplateManifest = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number(),
  supports: z.array(z.string()),
});
export type TemplateManifest = z.infer<typeof TemplateManifest>;

export const RenderPreviewInput = z.object({
  projectId: z.string().uuid(),
  templateId: z.string(),
});
export type RenderPreviewInput = z.infer<typeof RenderPreviewInput>;
