import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import type { Project } from '@shared/projects';

interface Props {
  project: Project | null;
  onClose: () => void;
  onRename: (id: string, name: string) => Promise<void>;
}

export default function RenameProjectDialog({ project, onClose, onRename }: Props) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setError(null);
      setSubmitting(false);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [project]);

  async function submit() {
    if (!project) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    if (trimmed === project.name) {
      onClose();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onRename(project.id, trimmed);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename project');
      setSubmitting(false);
    }
  }

  return (
    <Modal open={!!project} onClose={onClose} title="Rename project">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
