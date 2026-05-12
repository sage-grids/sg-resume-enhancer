import { describe, it, expect } from 'vitest';
import { scrubSecrets } from '../../src/main/logger';

describe('scrubSecrets', () => {
  it('redacts Authorization header values', () => {
    expect(scrubSecrets('Authorization: Bearer abc.def.ghi')).toBe('Authorization: [REDACTED]');
    expect(scrubSecrets('authorization=token-123')).toBe('authorization=[REDACTED]');
  });

  it('redacts api-key in either casing or punctuation', () => {
    expect(scrubSecrets('api-key=sk-12345')).toBe('api-key=[REDACTED]');
    expect(scrubSecrets('api_key: prod-xyz')).toBe('api_key: [REDACTED]');
    expect(scrubSecrets('API-KEY = OPENAI_LIVE_99')).toBe('API-KEY = [REDACTED]');
  });

  it('redacts Bearer tokens in free text', () => {
    expect(scrubSecrets('used Bearer tok_live_9 in request')).toBe(
      'used Bearer [REDACTED] in request',
    );
  });

  it('walks nested objects and arrays', () => {
    const result = scrubSecrets({
      headers: { Authorization: 'Bearer my-secret-token' },
      body: ['api-key=sk-1', 'safe text'],
      meta: { nested: { inner: 'Bearer deep-token' } },
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('my-secret-token');
    expect(serialized).not.toContain('sk-1');
    expect(serialized).not.toContain('deep-token');
    expect(serialized).toContain('[REDACTED]');
    expect(serialized).toContain('safe text');
  });

  it('passes through non-string primitives unchanged', () => {
    expect(scrubSecrets(42)).toBe(42);
    expect(scrubSecrets(null)).toBe(null);
    expect(scrubSecrets(undefined)).toBe(undefined);
    expect(scrubSecrets(true)).toBe(true);
  });
});
