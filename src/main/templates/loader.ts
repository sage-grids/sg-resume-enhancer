import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { logger } from '../logger';

export interface TemplateManifest {
  id: string;
  name: string;
  version: number;
  supports: string[];
}

export interface Template {
  manifest: TemplateManifest;
  html: string;
}

const templates: Map<string, Template> = new Map();

export function loadTemplates(): void {
  const templatesDir = getTemplatesDir();
  if (!fs.existsSync(templatesDir)) {
    logger.warn(`Templates directory not found at ${templatesDir}`);
    return;
  }

  const dirs = fs.readdirSync(templatesDir, { withFileTypes: true });
  for (const dir of dirs) {
    if (dir.isDirectory()) {
      try {
        const templatePath = path.join(templatesDir, dir.name);
        const manifestPath = path.join(templatePath, 'manifest.json');
        const htmlPath = path.join(templatePath, 'template.html');

        if (fs.existsSync(manifestPath) && fs.existsSync(htmlPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as TemplateManifest;
          const html = fs.readFileSync(htmlPath, 'utf8');
          templates.set(manifest.id, { manifest, html });
          logger.info(`Loaded template: ${manifest.id}`);
        }
      } catch (e) {
        logger.error(`Failed to load template in ${dir.name}`, e);
      }
    }
  }
}

export function listTemplates(): TemplateManifest[] {
  return Array.from(templates.values()).map((t) => t.manifest);
}

export function getTemplate(id: string): Template | undefined {
  return templates.get(id);
}

function getTemplatesDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'templates');
  }
  // In dev, assume it's in the project root
  return path.join(app.getAppPath(), 'templates');
}
