import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './app/Layout';
import ResumesTab from './features/resumes/ResumesTab';
import ResumeEditor from './features/resumes/ResumeEditor';
import AISettingsTab from './features/settings/AISettingsTab';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/resumes" replace />} />
        <Route path="/resumes" element={<ResumesTab />} />
        <Route path="/resumes/:projectId" element={<ResumeEditor />} />
        <Route path="/ai-settings" element={<AISettingsTab />} />
      </Route>
    </Routes>
  );
}
