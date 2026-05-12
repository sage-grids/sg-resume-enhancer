import { app, BrowserWindow, dialog } from 'electron';
import path from 'node:path';
import { logger } from './logger';
import { registerSystemIpc } from './ipc/system';
import { registerProjectsIpc } from './ipc/projects';
import { closeDb, loadBundledMigrations, openDb } from './db/client';

const isDev = !app.isPackaged;

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
  if (isDev && rendererUrl) {
    await win.loadURL(rendererUrl);
  } else {
    await win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

function initDatabase(): boolean {
  try {
    const filePath = path.join(app.getPath('userData'), 'sg-resume.db');
    openDb({ filePath, migrations: loadBundledMigrations() });
    logger.info(`db: opened at ${filePath}`);
    return true;
  } catch (e) {
    logger.error('db: failed to open', e);
    dialog.showErrorBox(
      'Database error',
      `Could not open the local database.\n\n${e instanceof Error ? e.message : String(e)}`,
    );
    return false;
  }
}

app.whenReady().then(() => {
  if (!initDatabase()) {
    app.quit();
    return;
  }
  registerSystemIpc();
  registerProjectsIpc();
  logger.info('app: ready');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  closeDb();
});
