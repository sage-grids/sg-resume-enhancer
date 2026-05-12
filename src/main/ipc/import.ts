import { dialog } from 'electron';
import path from 'node:path';
import { registerHandler, defineError } from './handler';
import { ImportInput } from '@shared/import';
import { importFromText } from '../import/text';
import { importFromDocx } from '../import/docx';
import { importFromPdf } from '../import/pdf';

export function registerImportIpc(): void {
  registerHandler('import.pickFile', null, async () => {
    const { filePath, canceled } = await dialog.showOpenDialog({
      title: 'Select Résumé to Import',
      filters: [
        { name: 'Résumé Files', extensions: ['pdf', 'docx', 'txt', 'md'] },
      ],
      properties: ['openFile'],
    });

    if (canceled || !filePath[0]) {
      return { canceled: true };
    }

    return { canceled: false, filePath: filePath[0] };
  });

  registerHandler('import.parseFile', ImportInput, async ({ filePath }) => {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      if (ext === '.pdf') {
        return await importFromPdf(filePath);
      } else if (ext === '.docx') {
        return await importFromDocx(filePath);
      } else if (ext === '.txt' || ext === '.md') {
        return await importFromText(filePath);
      } else {
        throw defineError('UNSUPPORTED_FORMAT', `Unsupported file format: ${ext}`);
      }
    } catch (e) {
      console.error(`Import failed for ${filePath}`, e);
      throw defineError('IMPORT_FAILED', e instanceof Error ? e.message : String(e));
    }
  });
}
