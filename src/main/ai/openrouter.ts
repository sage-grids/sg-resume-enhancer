import { OpenAIProvider } from './openai';
import { ProviderConfig } from '@shared/ai';

export class OpenRouterProvider extends OpenAIProvider {
  override id = 'openrouter' as const;

  protected override getBaseUrl(cfg: ProviderConfig): string {
    return cfg.baseUrl || 'https://openrouter.ai/api/v1';
  }

  protected override getHeaders(cfg: ProviderConfig): Record<string, string> {
    const headers = super.getHeaders(cfg);
    headers['HTTP-Referer'] = 'https://github.com/google-gemini/sg-resume-enhancer';
    headers['X-Title'] = 'SG Resume Enhancer';
    return headers;
  }
}
