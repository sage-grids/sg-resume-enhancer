import { Check, Layout } from 'lucide-react';
import { useTemplates } from './useTemplates';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';

interface Props {
  open: boolean;
  onClose: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function TemplateSelector({ open, onClose, selectedId, onSelect }: Props) {
  const { templates, loading } = useTemplates();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choose a Template"
      description="Select a layout for your résumé. You can change this at any time."
      className="max-w-3xl"
    >
      <div className="grid grid-cols-3 gap-4 py-4">
        {loading && <div className="col-span-3 text-center py-12 text-sm text-foreground/50">Loading templates...</div>}
        {templates?.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              onSelect(t.id);
              onClose();
            }}
            className={`group relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all hover:border-primary ${
              selectedId === t.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
            }`}
          >
            <div className="flex aspect-[3/4] w-full items-center justify-center rounded bg-muted group-hover:bg-muted/50">
              <Layout className="h-8 w-8 text-foreground/20" />
            </div>
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-medium">{t.name}</span>
              {selectedId === t.id && <Check className="h-4 w-4 text-primary" />}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
