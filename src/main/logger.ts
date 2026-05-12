import log from 'electron-log/main';

const SECRET_PATTERNS: RegExp[] = [
  /(authorization\s*[:=]\s*)([^,"\n\r]+)/gi,
  /(api[-_]?key\s*[:=]\s*)([^\s,"]+)/gi,
  /(\bbearer\s+)([^\s,"]+)/gi,
];

export function scrubSecrets(input: unknown): unknown {
  if (typeof input === 'string') {
    let out = input;
    for (const pat of SECRET_PATTERNS) out = out.replace(pat, '$1[REDACTED]');
    return out;
  }
  if (Array.isArray(input)) return input.map(scrubSecrets);
  if (input && typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      result[k] = scrubSecrets(v);
    }
    return result;
  }
  return input;
}

log.hooks.push((message) => {
  message.data = (message.data as unknown[]).map(scrubSecrets);
  return message;
});

export const logger = log;
