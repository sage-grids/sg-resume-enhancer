import type { Result } from './result';
import type {
  Project,
  ProjectCreateInput,
  ProjectRenameInput,
} from './projects';

export interface Api {
  system: {
    ping: () => Promise<Result<'pong'>>;
  };
  projects: {
    list: () => Promise<Result<Project[]>>;
    get: (input: { id: string }) => Promise<Result<Project>>;
    create: (input: ProjectCreateInput) => Promise<Result<Project>>;
    rename: (input: ProjectRenameInput) => Promise<Result<Project>>;
    duplicate: (input: { id: string }) => Promise<Result<Project>>;
    delete: (input: { id: string }) => Promise<Result<{ id: string }>>;
  };
}

declare global {
  interface Window {
    api: Api;
  }
}
