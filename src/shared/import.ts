import { z } from 'zod';
import { Resume } from './resume';

export const ImportCandidate = z.object({
  rawText: z.string(),
  parsed: Resume.partial(),
  warnings: z.array(z.string()),
});
export type ImportCandidate = z.infer<typeof ImportCandidate>;

export const ImportInput = z.object({
  filePath: z.string(),
});
export type ImportInput = z.infer<typeof ImportInput>;
