import { BrowserWindow } from 'electron';
import fs from 'node:fs';
import { logger } from '../logger';

export interface PrintOptions {
  pageSize: 'Letter' | 'A4';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export async function exportToPdf(html: string, outputPath: string, options: PrintOptions): Promise<void> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      sandbox: true,
    },
  });

  try {
    // We use a data URL for simplicity since templates are self-contained for now.
    // If we add local images/fonts, we might need to use a temp file.
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    // Wait for fonts to be ready
    await win.webContents.executeJavaScript('document.fonts.ready');

    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: options.pageSize,
      margins: {
        marginType: 'custom',
        top: options.margins.top,
        bottom: options.margins.bottom,
        left: options.margins.left,
        right: options.margins.right,
      },
    });

    fs.writeFileSync(outputPath, pdfBuffer);
    logger.info(`PDF exported successfully to ${outputPath}`);
  } catch (e) {
    logger.error('Failed to export PDF', e);
    throw e;
  } finally {
    win.destroy();
  }
}
