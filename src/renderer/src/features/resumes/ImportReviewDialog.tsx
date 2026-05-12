import { useState } from 'react';
import { AlertCircle, Loader2, Wand2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';
import { ImportCandidate } from '@shared/import';
import { Resume, DEFAULT_RESUME } from '@shared/resume';
import BasicsSection from './editor/BasicsSection';
import SummarySection from './editor/SummarySection';
import ExperienceSection from './editor/ExperienceSection';
import EducationSection from './editor/EducationSection';
import SkillsSection from './editor/SkillsSection';

interface Props {
  open: boolean;
  onClose: () => void;
  candidate: ImportCandidate;
  onImport: (resume: Resume) => Promise<void>;
}

export default function ImportReviewDialog({ open, onClose, candidate, onImport }: Props) {
  const [activeTab, setActiveTab] = useState('basics');
  const [resume, setResume] = useState<Resume>({
    ...DEFAULT_RESUME,
    ...candidate.parsed,
    schemaVersion: 1,
  } as Resume);
  const [importing, setImporting] = useState(false);

  const tabs = [
    { id: 'basics', label: 'Basics' },
    { id: 'summary', label: 'Summary' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
  ];

  async function handleImport() {
    setImporting(true);
    try {
      await onImport(resume);
      onClose();
    } catch (e) {
      console.error('Import failed', e);
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review Imported Résumé"
      description="We've done our best to parse your file. Please review and correct the data before creating a project."
      className="max-w-6xl"
    >
      <div className="flex h-[70vh] gap-6 py-4 overflow-hidden">
        {/* Left: Editor */}
        <div className="flex flex-1 flex-col border rounded-lg overflow-hidden bg-background">
          <div className="flex border-b bg-muted/30">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'basics' && (
              <BasicsSection data={resume.basics} onChange={(basics) => setResume({ ...resume, basics })} />
            )}
            {activeTab === 'summary' && (
              <SummarySection
                data={resume.summary || ''}
                onChange={(summary) => setResume({ ...resume, summary })}
              />
            )}
            {activeTab === 'experience' && (
              <ExperienceSection
                data={resume.experience}
                onChange={(experience) => setResume({ ...resume, experience })}
              />
            )}
            {activeTab === 'education' && (
              <EducationSection
                data={resume.education}
                onChange={(education) => setResume({ ...resume, education })}
              />
            )}
            {activeTab === 'skills' && (
              <SkillsSection
                data={resume.skills}
                onChange={(skills) => setResume({ ...resume, skills })}
              />
            )}
          </div>
        </div>

        {/* Right: Raw Text */}
        <div className="w-80 flex flex-col border rounded-lg bg-muted/10 overflow-hidden">
          <div className="px-4 py-2 border-b bg-muted/30 text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Raw Extracted Text
          </div>
          <div className="flex-1 overflow-y-auto p-4 whitespace-pre-wrap text-[11px] font-mono leading-relaxed text-foreground/70">
            {candidate.rawText}
          </div>
        </div>
      </div>

      {candidate.warnings.length > 0 && (
        <div className="mt-4 flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Import Warnings</p>
            <ul className="list-disc list-inside text-xs opacity-90">
              {candidate.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-6">
        <Button variant="ghost" onClick={onClose} disabled={importing}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={importing}>
          {importing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Project…
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Create Project
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
