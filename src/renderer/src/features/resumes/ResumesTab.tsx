import { FileText, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

export default function ResumesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resumes</h1>
          <p className="text-sm text-foreground/60">Your local résumé projects.</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          New project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            No projects yet
          </CardTitle>
          <CardDescription>
            Project creation lands in milestone M1. This screen is the empty-state placeholder.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-foreground/60">
          Soon you&apos;ll be able to import a PDF, DOCX, or text résumé — or start a blank one
          here.
        </CardContent>
      </Card>
    </div>
  );
}
