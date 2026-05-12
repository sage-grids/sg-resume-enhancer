import { useEffect, useState } from 'react';
import { Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { unwrap } from '../../lib/api';

interface Props {
  projectId: string;
  templateId?: string;
  resumeVersion?: number; // Used to trigger refresh
}

export default function PreviewPane({ projectId, templateId, resumeVersion }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.75);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = unwrap(
          await window.api.templates.renderPreview({ projectId, templateId: templateId || '' }),
        );
        setHtml(result.html);
      } catch (e) {
        console.error('Failed to render preview', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, templateId, resumeVersion]);

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div className="flex items-center justify-between border-b bg-background px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-foreground/50">
          Preview
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" onClick={() => setZoom(0.75)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto p-8">
        {loading && !html && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader2 className="h-8 w-8 animate-spin text-foreground/20" />
          </div>
        )}

        <div
          className="mx-auto origin-top bg-white shadow-2xl transition-transform"
          style={{
            width: '8.5in',
            height: '11in',
            transform: `scale(${zoom})`,
          }}
        >
          {html && (
            <iframe
              srcDoc={html}
              className="h-full w-full border-none"
              title="Resume Preview"
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </div>
    </div>
  );
}
