import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';

interface Props {
  data: string;
  onChange: (data: string) => void;
}

export default function SummarySection({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Professional Summary</h2>
        <p className="text-sm text-foreground/60">A brief overview of your background and goals.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={data}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Experienced software engineer with a focus on..."
          className="min-h-[200px]"
        />
      </div>
    </div>
  );
}
