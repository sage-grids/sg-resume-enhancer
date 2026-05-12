import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { z, type ZodTypeAny } from 'zod';
import { err, ok, type Result } from '@shared/result';
import { logger } from '../logger';

export interface HandlerError extends Error {
  code: string;
}

export function defineError(code: string, message: string): HandlerError {
  const e = new Error(message) as HandlerError;
  e.code = code;
  return e;
}

function isHandlerError(e: unknown): e is HandlerError {
  return e instanceof Error && typeof (e as HandlerError).code === 'string';
}

const NoInput = z.undefined().or(z.void());

/**
 * Register a typed IPC handler. Input is validated by Zod; output is wrapped
 * in the Result envelope. Unexpected errors are logged with stack and surfaced
 * as INTERNAL.
 */
export function registerHandler<I extends ZodTypeAny, O>(
  channel: string,
  inputSchema: I | null,
  fn: (input: z.infer<I>, event: IpcMainInvokeEvent) => O | Promise<O>,
): void {
  ipcMain.handle(channel, async (event, rawInput): Promise<Result<O>> => {
    const schema = inputSchema ?? NoInput;
    const parsed = schema.safeParse(rawInput);
    if (!parsed.success) {
      return err('INVALID_INPUT', parsed.error.issues.map((i) => i.message).join('; '));
    }
    try {
      const data = await fn(parsed.data as z.infer<I>, event);
      return ok(data);
    } catch (e) {
      if (isHandlerError(e)) {
        return err(e.code, e.message);
      }
      logger.error(`ipc ${channel}: unexpected error`, e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      return err('INTERNAL', message);
    }
  });
}
