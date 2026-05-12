import { ProviderConfig, EnhanceRequest, EnhanceChunk, ProviderId } from '@shared/ai';

export interface AIProvider {
  id: ProviderId;
  testConnection(cfg: ProviderConfig): Promise<{ ok: boolean; message?: string }>;
  enhance(
    cfg: ProviderConfig,
    req: EnhanceRequest,
    signal: AbortSignal,
  ): AsyncIterable<EnhanceChunk>;
}
