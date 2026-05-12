import { registerHandler, defineError } from './handler';
import { RenderPreviewInput } from '@shared/templates';
import { listTemplates, getTemplate } from '../templates/loader';
import { getResume } from '../db/resume';
import { getDb } from '../db/client';
import { renderTemplate } from '../templates/engine';
import { getProject } from '../db/projects';

export function registerTemplatesIpc(): void {
  registerHandler('templates.list', null, () => listTemplates());

  registerHandler('templates.renderPreview', RenderPreviewInput, ({ projectId, templateId }) => {
    const db = getDb();
    const project = getProject(db, projectId);
    const resume = getResume(db, projectId);
    const template = getTemplate(templateId || project.templateId);

    if (!template) {
      throw defineError('TEMPLATE_NOT_FOUND', `Template ${templateId} not found`);
    }

    const html = renderTemplate(template.html, resume);
    return { html };
  });
}
