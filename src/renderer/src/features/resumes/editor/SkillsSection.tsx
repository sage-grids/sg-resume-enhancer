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
import { SkillGroup as SkillGroupType } from '@shared/resume';
import { Button } from '../../../components/ui/button';
import { Plus, GripVertical, Trash2, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Input } from '../../../components/ui/input';

interface Props {
  data: SkillGroupType[];
  onChange: (data: SkillGroupType[]) => void;
}

export default function SkillsSection({ data, onChange }: Props) {
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
    const newItem: SkillGroupType = {
      id: nanoid(),
      category: '',
      items: [],
    };
    onChange([...data, newItem]);
  };

  const updateItem = (id: string, updates: Partial<SkillGroupType>) => {
    onChange(data.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Skills</h2>
          <p className="text-sm text-foreground/60">Group your skills by category.</p>
        </div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" /> Add category
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={data.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {data.map((item) => (
              <SortableSkillGroup
                key={item.id}
                item={item}
                onUpdate={(updates) => updateItem(item.id, updates)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-foreground/50">No skill categories added yet.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={addItem}>
            Add &quot;Languages&quot; or &quot;Frameworks&quot;
          </Button>
        </div>
      )}
    </div>
  );
}

interface ItemProps {
  item: SkillGroupType;
  onUpdate: (updates: Partial<SkillGroupType>) => void;
  onRemove: () => void;
}

function SortableSkillGroup({ item, onUpdate, onRemove }: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const addItem = (name: string) => {
    if (!name.trim()) return;
    onUpdate({ items: [...item.items, name.trim()] });
  };

  const removeItem = (index: number) => {
    onUpdate({ items: item.items.filter((_, i) => i !== index) });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card p-4 space-y-4 ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-foreground/30 hover:text-foreground/60"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Input
          value={item.category}
          onChange={(e) => onUpdate({ category: e.target.value })}
          placeholder="Category (e.g. Languages)"
          className="h-8 font-medium"
        />
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.items.map((skill, index) => (
          <div
            key={index}
            className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
          >
            {skill}
            <button
              onClick={() => removeItem(index)}
              className="ml-1 rounded-full hover:bg-foreground/10"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem('skill') as HTMLInputElement;
            addItem(input.value);
            input.value = '';
          }}
          className="inline-flex"
        >
          <Input
            name="skill"
            placeholder="Add skill..."
            className="h-7 w-24 text-xs"
          />
        </form>
      </div>
    </div>
  );
}
