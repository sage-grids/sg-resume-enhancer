import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Resume } from '@shared/resume';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

interface Props {
  data: Resume['basics'];
  onChange: (data: Resume['basics']) => void;
}

export default function BasicsSection({ data, onChange }: Props) {
  const { register, watch, setValue } = useForm<Resume['basics']>({
    resolver: zodResolver(Resume.shape.basics),
    defaultValues: data,
  });

  const values = watch();

  useEffect(() => {
    const subscription = watch((value) => {
      onChange(value as Resume['basics']);
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  const addLink = () => {
    const links = [...(values.links || []), { id: nanoid(), label: '', url: '' }];
    setValue('links', links);
  };

  const removeLink = (id: string) => {
    const links = (values.links || []).filter((l) => l.id !== id);
    setValue('links', links);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Basic Information</h2>
        <p className="text-sm text-foreground/60">Your contact details.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" {...register('fullName')} placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="headline">Headline</Label>
          <Input id="headline" {...register('headline')} placeholder="Software Engineer" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} placeholder="john@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register('phone')} placeholder="+1 234 567 890" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register('location')} placeholder="City, Country" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Links</Label>
          <Button variant="outline" size="sm" onClick={addLink}>
            <Plus className="mr-2 h-4 w-4" /> Add link
          </Button>
        </div>
        {(values.links || []).map((link, index) => (
          <div key={link.id} className="flex gap-2">
            <Input
              placeholder="Label (e.g. LinkedIn)"
              {...register(`links.${index}.label` as const)}
            />
            <Input
              placeholder="URL"
              {...register(`links.${index}.url` as const)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeLink(link.id)}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
