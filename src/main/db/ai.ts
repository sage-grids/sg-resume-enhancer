import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { providerConfigs } from './schema';
import { ProviderConfig, ProviderId } from '@shared/ai';
import { hasSecret } from '../secrets';

export function listProviderConfigs(db: BetterSQLite3Database): ProviderConfig[] {
  const rows = db.select().from(providerConfigs).all();
  
  // Ensure all providers are represented, even if not in DB
  const providers: ProviderId[] = ['ollama', 'openai', 'openrouter', 'google'];
  
  return providers.map(id => {
    const row = rows.find(r => r.providerId === id);
    return {
      providerId: id,
      enabled: row ? !!row.enabled : (id === 'ollama'), // Default ollama to enabled
      baseUrl: row ? row.baseUrl : null,
      defaultModel: row ? row.defaultModel : (id === 'ollama' ? 'llama3' : null),
      extraJson: row ? row.extraJson : null,
      hasKey: hasSecret(id),
    };
  });
}

export function saveProviderConfig(
  db: BetterSQLite3Database,
  cfg: ProviderConfig,
): void {
  const now = Date.now();
  db.insert(providerConfigs)
    .values({
      providerId: cfg.providerId,
      enabled: cfg.enabled ? 1 : 0,
      baseUrl: cfg.baseUrl,
      defaultModel: cfg.defaultModel,
      extraJson: cfg.extraJson,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: providerConfigs.providerId,
      set: {
        enabled: cfg.enabled ? 1 : 0,
        baseUrl: cfg.baseUrl,
        defaultModel: cfg.defaultModel,
        extraJson: cfg.extraJson,
        updatedAt: now,
      },
    })
    .run();
}
