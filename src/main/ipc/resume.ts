import { registerHandler } from './handler';
import { ResumeGetInput, ResumeUpdateInput } from '@shared/resume';
import { getResume, saveResume } from '../db/resume';
import { getDb } from '../db/client';

export function registerResumeIpc(): void {
  registerHandler('resume.get', ResumeGetInput, ({ projectId }) => {
    return getResume(getDb(), projectId);
  });

  registerHandler('resume.save', ResumeUpdateInput, ({ projectId, resume }) => {
    saveResume(getDb(), projectId, resume);
    return { success: true };
  });
}
