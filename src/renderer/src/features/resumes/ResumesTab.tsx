import { useState } from 'react';
import { Copy, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Project } from '@shared/projects';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import NewProjectDialog from './NewProjectDialog';
import RenameProjectDialog from './RenameProjectDialog';
import { useProjects } from './useProjects';

function formatUpdatedAt(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ResumesTab() {
  const { projects, loading, error, create, rename, duplicate, remove } = useProjects();
  const [newOpen, setNewOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onDuplicate(p: Project) {
    setBusyId(p.id);
    setActionError(null);
    try {
      await duplicate(p.id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to duplicate');
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(p: Project) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setBusyId(p.id);
    setActionError(null);
    try {
      await remove(p.id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resumes</h1>
          <p className="text-sm text-foreground/60">Your local résumé projects.</p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New project
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-red-600">
            Couldn&apos;t load projects: {error}
          </CardContent>
        </Card>
      ) : null}

      {actionError ? (
        <Card>
          <CardContent className="py-4 text-sm text-red-600">{actionError}</CardContent>
        </Card>
      ) : null}

      {loading && projects === null ? (
        <Card>
          <CardContent className="py-6 text-sm text-foreground/60">Loading…</CardContent>
        </Card>
      ) : projects && projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              No projects yet
            </CardTitle>
            <CardDescription>
              Create your first project to start drafting a résumé. Import support arrives in M5.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New project
            </Button>
          </CardContent>
        </Card>
      ) : projects ? (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {projects.map((p) => {
            const busy = busyId === p.id;
            return (
              <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                <FileText className="h-5 w-5 shrink-0 text-foreground/50" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-xs text-foreground/50">
                    Updated {formatUpdatedAt(p.updatedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRenameTarget(p)}
                    disabled={busy}
                    aria-label="Rename"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDuplicate(p)}
                    disabled={busy}
                    aria-label="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(p)}
                    disabled={busy}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <NewProjectDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={async (name) => {
          await create(name);
        }}
      />
      <RenameProjectDialog
        project={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRename={async (id, name) => {
          await rename(id, name);
        }}
      />
    </div>
  );
}
