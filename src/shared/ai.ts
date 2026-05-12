import { z } from 'zod';

export const ProviderId = z.enum(['ollama', 'openrouter', 'google', 'openai']);
export type ProviderId = z.infer<typeof ProviderId>;

export const ProviderConfig = z.object({
  providerId: ProviderId,
  enabled: z.boolean(),
  baseUrl: z.string().nullable(),
  defaultModel: z.string().nullable(),
  extraJson: z.string().nullable(),
  hasKey: z.boolean().optional(), // Computed in main, not stored in DB
});
export type ProviderConfig = z.infer<typeof ProviderConfig>;

export const EnhanceRequest = z.object({
  systemPrompt: z.string(),
  userPrompt: z.string(),
  model: z.string(),
  temperature: z.number().optional(),
});
export type EnhanceRequest = z.infer<typeof EnhanceRequest>;

export const EnhanceChunk = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('done') }),
  z.object({
    type: z.literal('error'),
    error: z.object({ code: z.string(), message: z.string() }),
  }),
]);
export type EnhanceChunk = z.infer<typeof EnhanceChunk>;
