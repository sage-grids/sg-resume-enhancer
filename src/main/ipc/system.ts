import { registerHandler } from './handler';

export function registerSystemIpc(): void {
  registerHandler('system.ping', null, () => 'pong' as const);
}
