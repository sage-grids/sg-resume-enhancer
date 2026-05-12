import { AIProvider } from './types';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import { OpenRouterProvider } from './openrouter';
import { GoogleProvider } from './google';
import { ProviderId } from '@shared/ai';

const providers: Record<ProviderId, AIProvider> = {
  ollama: new OllamaProvider(),
  openai: new OpenAIProvider(),
  openrouter: new OpenRouterProvider(),
  google: new GoogleProvider(),
};

export function getProvider(id: ProviderId): AIProvider {
  return providers[id];
}

export function listProviders(): AIProvider[] {
  return Object.values(providers);
}
