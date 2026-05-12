import { AIProvider } from './types';
import { ProviderConfig, EnhanceRequest, EnhanceChunk } from '@shared/ai';
import { getSecret } from '../secrets';

export class OpenAIProvider implements AIProvider {
  id = 'openai' as const;

  protected getBaseUrl(cfg: ProviderConfig): string {
    return cfg.baseUrl || 'https://api.openai.com/v1';
  }

  protected getHeaders(_cfg: ProviderConfig): Record<string, string> {
    const key = getSecret(this.id);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    };
  }

  async testConnection(cfg: ProviderConfig): Promise<{ ok: boolean; message?: string }> {
    try {
      const res = await fetch(`${this.getBaseUrl(cfg)}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(cfg),
        body: JSON.stringify({
          model: cfg.defaultModel || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'say hi' }],
          max_tokens: 1,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || `HTTP ${res.status}`);
      }

      return { ok: true, message: 'Connected to OpenAI.' };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  }

  async *enhance(
    cfg: ProviderConfig,
    req: EnhanceRequest,
    signal: AbortSignal,
  ): AsyncIterable<EnhanceChunk> {
    try {
      const res = await fetch(`${this.getBaseUrl(cfg)}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(cfg),
        body: JSON.stringify({
          model: req.model,
          messages: [
            { role: 'system', content: req.systemPrompt },
            { role: 'user', content: req.userPrompt },
          ],
          stream: true,
          temperature: req.temperature ?? 0.7,
        }),
        signal,
      });

      if (!res.ok) {
        const error = await res.json();
        yield {
          type: 'error',
          error: { code: 'OPENAI_ERROR', message: error.error?.message || 'Unknown error' },
        };
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.substring(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                yield { type: 'text', text: content };
              }
            } catch (e) {
              console.error('Failed to parse OpenAI SSE chunk', e);
            }
          }
        }
      }
      yield { type: 'done' };
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      yield {
        type: 'error',
        error: { code: 'OPENAI_FETCH_FAILED', message: e instanceof Error ? e.message : String(e) },
      };
    }
  }
}
