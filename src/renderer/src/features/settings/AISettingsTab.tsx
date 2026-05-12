import { useEffect, useState } from 'react';
import { Loader2, Save, Wifi } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { unwrap } from '../../lib/api';
import type { ProviderConfig, ProviderId } from '@shared/ai';

export default function AISettingsTab() {
  const [configs, setConfigs] = useState<ProviderConfig[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message?: string }>>({});

  useEffect(() => {
    async function load() {
      try {
        const data = unwrap(await window.api.ai.listConfigs());
        setConfigs(data);
      } catch (e) {
        console.error('Failed to load AI configs', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function onSave(cfg: ProviderConfig, key?: string) {
    setSavingId(cfg.providerId);
    try {
      if (key) {
        unwrap(await window.api.ai.setSecret({ providerId: cfg.providerId, key }));
      }
      unwrap(await window.api.ai.saveConfig(cfg));
      // Refresh to get updated hasKey etc.
      const data = unwrap(await window.api.ai.listConfigs());
      setConfigs(data);
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSavingId(null);
    }
  }

  async function onTest(id: ProviderId) {
    setTestingId(id);
    try {
      const res = unwrap(await window.api.ai.testConnection(id));
      setTestResults((prev) => ({ ...prev, [id]: res }));
    } catch (e) {
      setTestResults((prev) => ({
        ...prev,
        [id]: { ok: false, message: e instanceof Error ? e.message : String(e) },
      }));
    } finally {
      setTestingId(null);
    }
  }

  if (loading || !configs) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground/20" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Providers</h1>
        <p className="text-sm text-foreground/60">Configure your AI enhancement models.</p>
      </div>

      <div className="grid gap-6">
        {configs.map((cfg) => (
          <ProviderCard
            key={cfg.providerId}
            config={cfg}
            isSaving={savingId === cfg.providerId}
            isTesting={testingId === cfg.providerId}
            testResult={testResults[cfg.providerId]}
            onSave={onSave}
            onTest={() => onTest(cfg.providerId)}
          />
        ))}
      </div>
    </div>
  );
}

interface ProviderCardProps {
  config: ProviderConfig;
  isSaving: boolean;
  isTesting: boolean;
  testResult?: { ok: boolean; message?: string };
  onSave: (cfg: ProviderConfig, key?: string) => Promise<void>;
  onTest: () => void;
}

function ProviderCard({ config, isSaving, isTesting, testResult, onSave, onTest }: ProviderCardProps) {
  const [localCfg, setLocalCfg] = useState(config);
  const [key, setKey] = useState('');

  const hasKeyField = config.providerId !== 'ollama';
  const isDirty = JSON.stringify(localCfg) !== JSON.stringify(config) || key !== '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="capitalize">{config.providerId}</CardTitle>
          <CardDescription>
            {config.providerId === 'ollama' ? 'Local LLM (recommended for privacy)' : `Cloud-based ${config.providerId} models`}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
           <div className={`h-2 w-2 rounded-full ${config.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
           <span className="text-xs font-medium uppercase tracking-wider text-foreground/50">
             {config.enabled ? 'Enabled' : 'Disabled'}
           </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input
              value={localCfg.baseUrl || ''}
              placeholder={config.providerId === 'ollama' ? 'http://localhost:11434' : 'Default'}
              onChange={(e) => setLocalCfg({ ...localCfg, baseUrl: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label>Default Model</Label>
            <Input
              value={localCfg.defaultModel || ''}
              placeholder={config.providerId === 'ollama' ? 'llama3' : 'e.g. gpt-4o'}
              onChange={(e) => setLocalCfg({ ...localCfg, defaultModel: e.target.value || null })}
            />
          </div>
          {hasKeyField && (
            <div className="space-y-2 sm:col-span-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={key}
                placeholder={config.hasKey ? '••••••••••••••••' : 'Enter API key'}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>
          )}
        </div>

        {testResult && (
          <div className={`text-sm p-3 rounded-md border ${testResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {testResult.message}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={localCfg.enabled}
                onChange={(e) => setLocalCfg({ ...localCfg, enabled: e.target.checked })}
                className="rounded border-gray-300"
              />
              Enabled
            </label>
            <Button variant="outline" size="sm" onClick={onTest} disabled={isTesting}>
              {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
              Test connection
            </Button>
          </div>
          <Button onClick={() => onSave(localCfg, key || undefined)} disabled={!isDirty || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
