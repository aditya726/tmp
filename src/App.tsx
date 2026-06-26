import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { TemplatesPage } from './pages/TemplatesPage';
import { TemplateBuilderPage } from './pages/TemplateBuilderPage';
import { useToast } from './hooks/useToast';

export default function App() {
  const toast = useToast();

  return (
    <AppShell toasts={toast.toasts} onRemoveToast={toast.remove}>
      <Routes>
        <Route path="/" element={<Navigate to="/templates" replace />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route
          path="/templates/:templateId"
          element={
            <TemplateBuilderPage
              onToast={(type, title, message) => {
                if (type === 'success') toast.success(title, message);
                else toast.error(title, message);
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to="/templates" replace />} />
      </Routes>
    </AppShell>
  );
}
