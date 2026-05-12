import type { Result } from '@shared/result';

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

export function unwrap<T>(res: Result<T>): T {
  if (res.ok) return res.data;
  throw new ApiError(res.error.code, res.error.message);
}
