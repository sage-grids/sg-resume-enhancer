import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExperienceItem as ExperienceItemType } from '@shared/resume';
import { Button } from '../../../components/ui/button';
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useState } from 'react';

interface Props {
  data: ExperienceItemType[];
  onChange: (data: ExperienceItemType[]) => void;
}

export default function ExperienceSection({ data, onChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(data[0]?.id || null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over.id);
      onChange(arrayMove(data, oldIndex, newIndex));
    }
  };

  const addItem = () => {
    const newItem: ExperienceItemType = {
      id: nanoid(),
      company: '',
      role: '',
      startDate: '',
      endDate: null,
      bullets: [],
    };
    onChange([...data, newItem]);
    setExpandedId(newItem.id);
  };

  const updateItem = (id: string, updates: Partial<ExperienceItemType>) => {
    onChange(data.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Work Experience</h2>
          <p className="text-sm text-foreground/60">Your professional history.</p>
        </div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" /> Add experience
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={data.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {data.map((item) => (
              <SortableExperienceItem
                key={item.id}
                item={item}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onUpdate={(updates) => updateItem(item.id, updates)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-foreground/50">No experience items added yet.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={addItem}>
            Add your first job
          </Button>
        </div>
      )}
    </div>
  );
}

interface ItemProps {
  item: ExperienceItemType;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<ExperienceItemType>) => void;
  onRemove: () => void;
}

function SortableExperienceItem({ item, isExpanded, onToggle, onUpdate, onRemove }: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border bg-card transition-shadow ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-foreground/30 hover:text-foreground/60"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 cursor-pointer" onClick={onToggle}>
          <div className="font-medium">{item.company || 'New Company'}</div>
          <div className="text-xs text-foreground/50">{item.role || 'New Role'}</div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={item.company}
                onChange={(e) => onUpdate({ company: e.target.value })}
                placeholder="Google"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={item.role}
                onChange={(e) => onUpdate({ role: e.target.value })}
                placeholder="Senior Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                value={item.startDate}
                onChange={(e) => onUpdate({ startDate: e.target.value })}
                placeholder="2021-01"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date (leave empty for &quot;Present&quot;)</Label>
              <Input
                value={item.endDate || ''}
                onChange={(e) => onUpdate({ endDate: e.target.value || null })}
                placeholder="2023-05"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Location</Label>
              <Input
                value={item.location || ''}
                onChange={(e) => onUpdate({ location: e.target.value })}
                placeholder="Mountain View, CA"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bullets (one per line)</Label>
            <Textarea
              value={item.bullets.join('\n')}
              onChange={(e) => onUpdate({ bullets: e.target.value.split('\n') })}
              placeholder="- Led a team of 5 developers&#10;- Improved performance by 20%"
              className="min-h-[150px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
