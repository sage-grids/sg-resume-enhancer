# 08 — AI providers & secure config

**Milestone:** M6
**Owner:** TBD
**Status:** Pending

## Goal

A pluggable provider layer with four MVP implementations, secure key storage, and a "Test connection" affordance per PRD §8.

## Provider interface

```ts
// src/main/ai/types.ts

export type ProviderId = 'ollama' | 'openrouter' | 'google' | 'openai';

export interface EnhanceRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature?: number;
}

export interface EnhanceChunk {
  type: 'text' | 'done' | 'error';
  text?: string;
  error?: { code: string; message: string };
}

export interface AIProvider {
  id: ProviderId;
  testConnection(cfg: ProviderConfig): Promise<{ ok: boolean; message?: string }>;
  enhance(
    cfg: ProviderConfig,
    req: EnhanceRequest,
    signal: AbortSignal,
  ): AsyncIterable<EnhanceChunk>;
}
```

A registry maps `ProviderId → AIProvider`. The IPC handler picks the registered provider based on the saved default (or per-call override).

## Per-provider notes

### Ollama (default)

- Base URL default: `http://localhost:11434`.
- Endpoint: `POST /api/chat` with `stream: true`. Parse line-delimited JSON.
- `testConnection`: `GET /api/tags` — verifies reachable + can list installed models.
- No API key. Surface a clear "Ollama not reachable — is it running?" empty state on first launch.

### OpenAI

- Endpoint: `POST https://api.openai.com/v1/chat/completions` with `stream: true`, SSE.
- Auth: `Authorization: Bearer <key>`.
- `testConnection`: a 1-token completion against the configured `default_model`.

### OpenRouter

- OpenAI-compatible API at `https://openrouter.ai/api/v1/chat/completions`.
- Required headers: `Authorization: Bearer <key>`, optionally `HTTP-Referer` and `X-Title` for attribution.
- Reuse the OpenAI streaming parser.

### Google GenAI

- Use `@google/genai` SDK.
- Auth: API key. (OAuth deferred.)
- `generateContentStream({ model, contents, … })`; adapt chunks to `EnhanceChunk`.

## Secrets

```ts
// src/main/secrets/index.ts
export function setSecret(key: string, value: string): void {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('NO_SAFE_STORAGE');
  const enc = safeStorage.encryptString(value).toString('base64');
  settingsRepo.set(`secret:${key}`, enc);
}
export function getSecret(key: string): string | null {
  const enc = settingsRepo.get(`secret:${key}`);
  if (!enc) return null;
  return safeStorage.decryptString(Buffer.from(enc, 'base64'));
}
```

- Keys never appear in logs (centralized log scrubber + a unit test that grep-asserts on a forced-failure path).
- Renderer only ever sees `{ provider_id, hasKey: true|false, masked: '••••1234' }`, never the cleartext.

## Acceptance

- All four providers complete a real chat turn against their service (manual smoke + CI mock).
- "Test connection" returns within 5s with a clear pass/fail message for each provider.
- Disabling a provider stops it from being selectable as the default.
- Killing an in-flight enhance request via cancel actually aborts the HTTP socket (integration test using a slow mock server).
