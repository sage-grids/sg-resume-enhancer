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
import { EducationItem as EducationItemType } from '@shared/resume';
import { Button } from '../../../components/ui/button';
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useState } from 'react';

// NOTE: Fixed a typo in @dnd-kit/core import in previous file if any, 
// actually I'll just be careful here.

interface Props {
  data: EducationItemType[];
  onChange: (data: EducationItemType[]) => void;
}

export default function EducationSection({ data, onChange }: Props) {
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
    const newItem: EducationItemType = {
      id: nanoid(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      details: '',
    };
    onChange([...data, newItem]);
    setExpandedId(newItem.id);
  };

  const updateItem = (id: string, updates: Partial<EducationItemType>) => {
    onChange(data.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Education</h2>
          <p className="text-sm text-foreground/60">Your academic background.</p>
        </div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" /> Add education
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={data.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {data.map((item) => (
              <SortableEducationItem
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
          <p className="text-sm text-foreground/50">No education items added yet.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={addItem}>
            Add your first degree
          </Button>
        </div>
      )}
    </div>
  );
}

interface ItemProps {
  item: EducationItemType;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<EducationItemType>) => void;
  onRemove: () => void;
}

function SortableEducationItem({ item, isExpanded, onToggle, onUpdate, onRemove }: ItemProps) {
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
          <div className="font-medium">{item.institution || 'New Institution'}</div>
          <div className="text-xs text-foreground/50">
            {item.degree}{item.field ? ` in ${item.field}` : ''}
          </div>
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
              <Label>Institution</Label>
              <Input
                value={item.institution}
                onChange={(e) => onUpdate({ institution: e.target.value })}
                placeholder="University of Waterloo"
              />
            </div>
            <div className="space-y-2">
              <Label>Degree</Label>
              <Input
                value={item.degree}
                onChange={(e) => onUpdate({ degree: e.target.value })}
                placeholder="Bachelor of Science"
              />
            </div>
            <div className="space-y-2">
              <Label>Field of Study</Label>
              <Input
                value={item.field || ''}
                onChange={(e) => onUpdate({ field: e.target.value })}
                placeholder="Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                value={item.startDate || ''}
                onChange={(e) => onUpdate({ startDate: e.target.value })}
                placeholder="2016"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                value={item.endDate || ''}
                onChange={(e) => onUpdate({ endDate: e.target.value })}
                placeholder="2020"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Details / Honors</Label>
            <Textarea
              value={item.details || ''}
              onChange={(e) => onUpdate({ details: e.target.value })}
              placeholder="Dean's List, GPA 3.9/4.0..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
