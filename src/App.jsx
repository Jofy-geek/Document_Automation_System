import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useProjectStore } from './store/useProjectStore';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import Requirements from './pages/Requirements';
import Preview from './pages/Preview';

const TITLES_TO_REMOVE = [
  "Bulk QR Code Generation Engine",
  "Admin Dashboard",
  "QR Code Generation",
  "Batch-Based QR Generation",
  "Admin Authentication",
  "Dashboard Module",
  "Batch View & Management",
  "Export Module",
  "Logs & History Module",
  "Batch",
  "QR Code",
  "Admin User",
  "Export Record"
];

function App() {
  useEffect(() => {
    const store = useProjectStore.getState();
    let hasChanges = false;
    
    const filterNodes = (nodes) => {
      let changed = false;
      const filtered = nodes.filter(node => {
        if (TITLES_TO_REMOVE.includes(node.title)) {
          changed = true;
          return false;
        }
        return true;
      }).map(node => {
        if (node.children && node.children.length > 0) {
          const { changed: childChanged, filtered: childFiltered } = filterNodes(node.children);
          if (childChanged) changed = true;
          return { ...node, children: childFiltered };
        }
        return node;
      });
      return { changed, filtered };
    };

    const newProjects = store.projects.map(p => {
      if (!p.sections || p.sections.length === 0) return p;
      const { changed, filtered } = filterNodes(p.sections);
      if (changed) {
        hasChanges = true;
        return { ...p, sections: filtered };
      }
      return p;
    });

    if (hasChanges) {
      useProjectStore.setState({ projects: newProjects });
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects/new" element={<CreateProject />} />
          <Route path="projects/:id/requirements" element={<Requirements />} />
          <Route path="projects/:id/preview" element={<Preview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
