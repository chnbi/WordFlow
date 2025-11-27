import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import TranslationReview from './pages/TranslationReview';
import GlossaryManager from './pages/GlossaryManager';
import ExportPage from './pages/ExportPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects/:projectId" element={<ProjectDetails />} />
        <Route path="projects/:projectId/review" element={<TranslationReview />} />
        <Route path="glossary" element={<GlossaryManager />} />
        <Route path="projects/:projectId/export" element={<ExportPage />} />
      </Route>
    </Routes>
  );
}

export default App;
