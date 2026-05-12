import { registerHandler, defineError } from './handler';
import {
  ProjectCreateInput,
  ProjectIdInput,
  ProjectRenameInput,
} from '@shared/projects';
import {
  createProject,
  deleteProject,
  duplicateProject,
  getProject,
  listProjects,
  renameProject,
  ProjectNotFoundError,
} from '../db/projects';
import { getDb } from '../db/client';

function mapDomainError(e: unknown): never {
  if (e instanceof ProjectNotFoundError) {
    throw defineError('PROJECT_NOT_FOUND', e.message);
  }
  throw e;
}

export function registerProjectsIpc(): void {
  registerHandler('projects.list', null, () => listProjects(getDb()));

  registerHandler('projects.get', ProjectIdInput, ({ id }) => {
    try {
      return getProject(getDb(), id);
    } catch (e) {
      mapDomainError(e);
    }
  });

  registerHandler('projects.create', ProjectCreateInput, (input) =>
    createProject(getDb(), input),
  );

  registerHandler('projects.rename', ProjectRenameInput, (input) => {
    try {
      return renameProject(getDb(), input);
    } catch (e) {
      mapDomainError(e);
    }
  });

  registerHandler('projects.duplicate', ProjectIdInput, ({ id }) => {
    try {
      return duplicateProject(getDb(), id);
    } catch (e) {
      mapDomainError(e);
    }
  });

  registerHandler('projects.delete', ProjectIdInput, ({ id }) => {
    try {
      deleteProject(getDb(), id);
      return { id } as { id: string };
    } catch (e) {
      mapDomainError(e);
    }
  });
}

