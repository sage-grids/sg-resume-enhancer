import { useState } from 'react';
import { Download, FileDown, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Modal,
} from '../../components/ui/modal';
import { unwrap } from '../../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export default function ExportDialog({ open, onClose, projectId }: Props) {
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
  const [pageSize, setPageSize] = useState<'Letter' | 'A4'>('Letter');
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState<{ path: string } | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const result = unwrap(await window.api.projects.export({ projectId, format, pageSize }));
      if (!result.canceled && result.filePath) {
        setSuccess({ path: result.filePath });
      }
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setExporting(false);
    }
  }

  function handleReveal() {
    if (success) {
      window.api.system.showItemInFolder({ path: success.path });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export Résumé"
      description="Save your résumé as a high-quality PDF or Word document."
    >
      <div className="space-y-6 py-4">
        {!success ? (
          <>
            <div className="space-y-3">
              <label className="text-sm font-medium">Format</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setFormat('pdf')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-4 transition-all ${
                    format === 'pdf' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                  }`}
                >
                  <FileDown className="h-5 w-5" />
                  <span className="font-medium">PDF</span>
                </button>
                <button
                  onClick={() => setFormat('docx')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-4 transition-all ${
                    format === 'docx' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                  }`}
                >
                  <Download className="h-5 w-5" />
                  <span className="font-medium">Word (DOCX)</span>
                </button>
              </div>
            </div>

            {format === 'pdf' && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Paper Size</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setPageSize('Letter')}
                    className={`flex-1 rounded-md border py-2 text-sm transition-all ${
                      pageSize === 'Letter' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                    }`}
                  >
                    Letter (8.5&quot; x 11&quot;)
                  </button>
                  <button
                    onClick={() => setPageSize('A4')}
                    className={`flex-1 rounded-md border py-2 text-sm transition-all ${
                      pageSize === 'A4' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                    }`}
                  >
                    A4 (210 x 297 mm)
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={onClose} disabled={exporting}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={exporting}>
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting…
                  </>
                ) : (
                  'Save as...'
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium">Export Successful</h3>
              <p className="text-sm text-foreground/60 mt-1">
                Your résumé has been saved to your computer.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={handleReveal}>
                Show in folder
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
