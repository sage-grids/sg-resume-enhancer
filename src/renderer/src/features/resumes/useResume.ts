import { useCallback, useEffect, useState, useRef } from 'react';
import type { Resume } from '@shared/resume';
import { unwrap } from '../../lib/api';
import debounce from 'lodash.debounce';

interface State {
  resume: Resume | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  lastSaved: number | null;
}

export function useResume(projectId: string | undefined) {
  const [state, setState] = useState<State>({
    resume: null,
    loading: true,
    error: null,
    saving: false,
    lastSaved: null,
  });

  const load = useCallback(async () => {
    if (!projectId) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = unwrap(await window.api.resume.get({ projectId }));
      setState({
        resume: data,
        loading: false,
        error: null,
        saving: false,
        lastSaved: Date.now(),
      });
    } catch (e) {
      setState({
        resume: null,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load resume',
        saving: false,
        lastSaved: null,
      });
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveDebounced = useRef(
    debounce(async (id: string, resume: Resume) => {
      setState((s) => ({ ...s, saving: true }));
      try {
        unwrap(await window.api.resume.save({ projectId: id, resume }));
        setState((s) => ({ ...s, saving: false, lastSaved: Date.now() }));
      } catch (e) {
        setState((s) => ({
          ...s,
          saving: false,
          error: e instanceof Error ? e.message : 'Failed to save resume',
        }));
      }
    }, 800),
  ).current;

  const update = useCallback(
    (newResume: Resume) => {
      if (!projectId) return;
      setState((s) => ({ ...s, resume: newResume }));
      saveDebounced(projectId, newResume);
    },
    [projectId, saveDebounced],
  );

  return { ...state, update, refresh: load };
}
