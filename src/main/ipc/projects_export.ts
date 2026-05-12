import { dialog, shell } from 'electron';
import { z } from 'zod';
import { registerHandler, defineError } from './handler';
import { ExportInput } from '@shared/export';
import { getResume } from '../db/resume';
import { getProject } from '../db/projects';
import { getDb } from '../db/client';
import { getTemplate } from '../templates/loader';
import { renderTemplate } from '../templates/engine';
import { exportToPdf } from '../export/pdf';
import { exportToDocx } from '../export/docx';

export function registerExportIpc(): void {
  registerHandler('projects.export', ExportInput, async ({ projectId, format, pageSize }) => {
    const db = getDb();
    const project = getProject(db, projectId);
    const resume = getResume(db, projectId);

    const defaultPath = `${project.name}.${format}`;
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: `Export Résumé as ${format.toUpperCase()}`,
      defaultPath,
      filters: [
        {
          name: format === 'pdf' ? 'PDF Documents' : 'Word Documents',
          extensions: [format],
        },
      ],
    });

    if (canceled || !filePath) {
      return { canceled: true };
    }

    if (format === 'pdf') {
      const template = getTemplate(project.templateId);
      if (!template) {
        throw defineError('TEMPLATE_NOT_FOUND', `Template ${project.templateId} not found`);
      }

      const html = renderTemplate(template.html, resume);
      await exportToPdf(html, filePath, {
        pageSize,
        margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
      });
    } else {
      await exportToDocx(resume, filePath);
    }

    return { canceled: false, filePath };
  });

  registerHandler('system.showItemInFolder', z.object({ path: z.string() }), ({ path }) => {
    shell.showItemInFolder(path);
  });
}
