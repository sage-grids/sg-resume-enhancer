import { Settings2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

export default function AISettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Settings</h1>
        <p className="text-sm text-foreground/60">
          Choose a provider for AI-assisted résumé enhancement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Provider configuration
          </CardTitle>
          <CardDescription>
            Per-provider panels (Ollama, OpenRouter, Google GenAI, OpenAI) land in milestone M6.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-foreground/60">
          Ollama is planned as the default. API keys will be stored using OS-level secure storage.
        </CardContent>
      </Card>
    </div>
  );
}
