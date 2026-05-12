import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './types';
import { ProviderConfig, EnhanceRequest, EnhanceChunk } from '@shared/ai';
import { getSecret } from '../secrets';

export class GoogleProvider implements AIProvider {
  id = 'google' as const;

  async testConnection(cfg: ProviderConfig): Promise<{ ok: boolean; message?: string }> {
    const key = getSecret(this.id);
    if (!key) return { ok: false, message: 'API key is missing' };

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: cfg.defaultModel || 'gemini-1.5-flash' });
      await model.generateContent('say hi');
      return { ok: true, message: 'Connected to Google GenAI.' };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  }

  async *enhance(
    cfg: ProviderConfig,
    req: EnhanceRequest,
    signal: AbortSignal,
  ): AsyncIterable<EnhanceChunk> {
    const key = getSecret(this.id);
    if (!key) {
      yield { type: 'error', error: { code: 'GOOGLE_KEY_MISSING', message: 'API key is missing' } };
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: req.model });
      
      const result = await model.generateContentStream({
        contents: [
          { role: 'user', parts: [{ text: `${req.systemPrompt}\n\n${req.userPrompt}` }] },
        ],
        generationConfig: {
          temperature: req.temperature ?? 0.7,
        },
      });

      // No native AbortSignal support in SDK yet, we'd need to wrap it if we want hard abort
      // But we can check signal between chunks.

      for await (const chunk of result.stream) {
        if (signal.aborted) return;
        const text = chunk.text();
        if (text) {
          yield { type: 'text', text };
        }
      }
      yield { type: 'done' };
    } catch (e) {
      yield {
        type: 'error',
        error: { code: 'GOOGLE_ERROR', message: e instanceof Error ? e.message : String(e) },
      };
    }
  }
}
