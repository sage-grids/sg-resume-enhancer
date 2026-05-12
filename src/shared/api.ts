import type { Result } from './result';
import type {
  Project,
  ProjectCreateInput,
  ProjectRenameInput,
} from './projects';
import type { Resume, ResumeGetInput, ResumeUpdateInput } from './resume';
import type { TemplateManifest, RenderPreviewInput } from './templates';
import type { ExportInput } from './export';
import type { ImportCandidate, ImportInput } from './import';
import type { ProviderConfig, ProviderId } from './ai';

export interface Api {
  system: {
    ping: () => Promise<Result<'pong'>>;
    showItemInFolder: (input: { path: string }) => Promise<Result<void>>;
  };
  projects: {
    list: () => Promise<Result<Project[]>>;
    get: (input: { id: string }) => Promise<Result<Project>>;
    create: (input: ProjectCreateInput) => Promise<Result<Project>>;
    rename: (input: ProjectRenameInput) => Promise<Result<Project>>;
    updateTemplate: (input: { id: string; templateId: string }) => Promise<Result<Project>>;
    duplicate: (input: { id: string }) => Promise<Result<Project>>;
    delete: (input: { id: string }) => Promise<Result<{ id: string }>>;
    export: (input: ExportInput) => Promise<Result<{ canceled: boolean; filePath?: string }>>;
  };
  resume: {
    get: (input: ResumeGetInput) => Promise<Result<Resume>>;
    save: (input: ResumeUpdateInput) => Promise<Result<{ success: true }>>;
  };
  templates: {
    list: () => Promise<Result<TemplateManifest[]>>;
    renderPreview: (input: RenderPreviewInput) => Promise<Result<{ html: string }>>;
  };
  import: {
    pickFile: () => Promise<Result<{ canceled: boolean; filePath?: string }>>;
    parseFile: (input: ImportInput) => Promise<Result<ImportCandidate>>;
  };
  ai: {
    listConfigs: () => Promise<Result<ProviderConfig[]>>;
    saveConfig: (input: ProviderConfig) => Promise<Result<{ success: true }>>;
    setSecret: (input: { providerId: ProviderId; key: string }) => Promise<Result<{ success: true }>>;
    testConnection: (input: ProviderId) => Promise<Result<{ ok: boolean; message?: string }>>;
  };
}

declare global {
  interface Window {
    api: Api;
  }
}
