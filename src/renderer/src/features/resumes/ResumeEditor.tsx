import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, Save, Layout, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useResume } from './useResume';
import { unwrap } from '../../lib/api';
import type { Project } from '@shared/projects';
import BasicsSection from './editor/BasicsSection';
import SummarySection from './editor/SummarySection';
import ExperienceSection from './editor/ExperienceSection';
import EducationSection from './editor/EducationSection';
import SkillsSection from './editor/SkillsSection';
import PreviewPane from './PreviewPane';
import TemplateSelector from './TemplateSelector';
import ExportDialog from './ExportDialog';

export default function ResumeEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { resume, loading, error, saving, lastSaved, update } = useResume(projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('basics');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      window.api.projects.get({ id: projectId }).then((res) => {
        setProject(unwrap(res));
      });
    }
  }, [projectId]);

  if ((loading && !resume) || !project) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground/20" />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error || 'Project not found'}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/resumes')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to projects
        </Button>
      </div>
    );
  }

  const handleTemplateSelect = async (templateId: string) => {
    if (project) {
      try {
        const updated = unwrap(await window.api.projects.updateTemplate({ id: project.id, templateId }));
        setProject(updated);
      } catch (e) {
        console.error('Failed to update template', e);
      }
    }
  };

  const tabs = [
    { id: 'basics', label: 'Basics' },
    { id: 'summary', label: 'Summary' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/resumes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <div className="flex items-center gap-2 text-sm text-foreground/50">
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </>
            ) : lastSaved ? (
              <>
                <Check className="h-3 w-3" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                Unsaved changes
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
            <Layout className="mr-2 h-4 w-4" />
            Template
          </Button>
          <Button size="sm" onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-muted/30 p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/60 hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-2xl">
              {activeTab === 'basics' && (
                <BasicsSection
                  data={resume.basics}
                  onChange={(basics) => update({ ...resume, basics })}
                />
              )}
              {activeTab === 'summary' && (
                <SummarySection
                  data={resume.summary || ''}
                  onChange={(summary) => update({ ...resume, summary })}
                />
              )}
              {activeTab === 'experience' && (
                <ExperienceSection
                  data={resume.experience}
                  onChange={(experience) => update({ ...resume, experience })}
                />
              )}
              {activeTab === 'education' && (
                <EducationSection
                  data={resume.education}
                  onChange={(education) => update({ ...resume, education })}
                />
              )}
              {activeTab === 'skills' && (
                <SkillsSection
                  data={resume.skills}
                  onChange={(skills) => update({ ...resume, skills })}
                />
              )}
            </div>
          </div>

          <div className="w-[500px] border-l xl:w-[600px] 2xl:w-[800px]">
            <PreviewPane
              projectId={project.id}
              templateId={project.templateId}
              resumeVersion={lastSaved || 0}
            />
          </div>
        </main>
      </div>

      <TemplateSelector
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        selectedId={project.templateId}
        onSelect={handleTemplateSelect}
      />

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        projectId={project.id}
      />
    </div>
  );
}
