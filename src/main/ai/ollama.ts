import { AIProvider } from './types';
import { ProviderConfig, EnhanceRequest, EnhanceChunk } from '@shared/ai';

export class OllamaProvider implements AIProvider {
  id = 'ollama' as const;

  async testConnection(cfg: ProviderConfig): Promise<{ ok: boolean; message?: string }> {
    const baseUrl = cfg.baseUrl || 'http://localhost:11434';
    try {
      const res = await fetch(`${baseUrl}/api/tags`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { ok: true, message: `Connected. ${data.models?.length || 0} models available.` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  }

  async *enhance(
    cfg: ProviderConfig,
    req: EnhanceRequest,
    signal: AbortSignal,
  ): AsyncIterable<EnhanceChunk> {
    const baseUrl = cfg.baseUrl || 'http://localhost:11434';
    
    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: req.model,
          messages: [
            { role: 'system', content: req.systemPrompt },
            { role: 'user', content: req.userPrompt },
          ],
          stream: true,
          options: {
            temperature: req.temperature ?? 0.7,
          },
        }),
        signal,
      });

      if (!res.ok) {
        const error = await res.text();
        yield { type: 'error', error: { code: 'OLLAMA_ERROR', message: error } };
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
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              yield { type: 'text', text: json.message.content };
            }
            if (json.done) {
              yield { type: 'done' };
              return;
            }
          } catch (e) {
            console.error('Failed to parse Ollama chunk', e);
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      yield { type: 'error', error: { code: 'OLLAMA_FETCH_FAILED', message: e instanceof Error ? e.message : String(e) } };
    }
  }
}
