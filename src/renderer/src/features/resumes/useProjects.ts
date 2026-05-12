import { useCallback, useEffect, useState } from 'react';
import type { Project } from '@shared/projects';
import { unwrap } from '../../lib/api';

interface State {
  projects: Project[] | null;
  loading: boolean;
  error: string | null;
}

export function useProjects() {
  const [state, setState] = useState<State>({ projects: null, loading: true, error: null });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = unwrap(await window.api.projects.list());
      setState({ projects: data, loading: false, error: null });
    } catch (e) {
      setState({
        projects: null,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load projects',
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (name: string) => {
      const project = unwrap(await window.api.projects.create({ name }));
      await refresh();
      return project;
    },
    [refresh],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      const project = unwrap(await window.api.projects.rename({ id, name }));
      await refresh();
      return project;
    },
    [refresh],
  );

  const duplicate = useCallback(
    async (id: string) => {
      const project = unwrap(await window.api.projects.duplicate({ id }));
      await refresh();
      return project;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      unwrap(await window.api.projects.delete({ id }));
      await refresh();
    },
    [refresh],
  );

  return { ...state, refresh, create, rename, duplicate, remove };
}
