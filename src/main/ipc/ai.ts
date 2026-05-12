import { z } from 'zod';
import { registerHandler } from './handler';
import { ProviderConfig, ProviderId } from '@shared/ai';
import { listProviderConfigs, saveProviderConfig } from '../db/ai';
import { getDb } from '../db/client';
import { getProvider } from '../ai/registry';
import { setSecret } from '../secrets';

export function registerAiIpc(): void {
  registerHandler('ai.listConfigs', null, () => {
    return listProviderConfigs(getDb());
  });

  registerHandler('ai.saveConfig', ProviderConfig, (cfg) => {
    saveProviderConfig(getDb(), cfg);
    return { success: true };
  });

  registerHandler('ai.setSecret', z.object({ providerId: ProviderId, key: z.string() }), ({ providerId, key }) => {
    setSecret(providerId, key);
    return { success: true };
  });

  registerHandler('ai.testConnection', ProviderId, async (id) => {
    const configs = listProviderConfigs(getDb());
    const cfg = configs.find(c => c.providerId === id);
    if (!cfg) throw new Error(`Config for ${id} not found`);
    
    const provider = getProvider(id);
    return await provider.testConnection(cfg);
  });
}
