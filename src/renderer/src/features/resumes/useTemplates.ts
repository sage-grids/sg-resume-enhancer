import { useCallback, useEffect, useState } from 'react';
import type { TemplateManifest } from '@shared/templates';
import { unwrap } from '../../lib/api';

interface State {
  templates: TemplateManifest[] | null;
  loading: boolean;
  error: string | null;
}

export function useTemplates() {
  const [state, setState] = useState<State>({ templates: null, loading: true, error: null });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = unwrap(await window.api.templates.list());
      setState({ templates: data, loading: false, error: null });
    } catch (e) {
      setState({
        templates: null,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load templates',
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
