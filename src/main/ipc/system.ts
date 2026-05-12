import { ipcMain } from 'electron';

export function registerSystemIpc(): void {
  ipcMain.handle('system.ping', () => ({ ok: true, data: 'pong' as const }));
}
