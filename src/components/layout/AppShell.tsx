import { AppSidebar } from './AppSidebar';
import { ToastContainer } from '../ui/Toast';
import type { Toast } from '../../hooks/useToast';

interface AppShellProps {
  children: React.ReactNode;
  toasts: Toast[];
  onRemoveToast: (id: string) => void;
}

export function AppShell({ children, toasts, onRemoveToast }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7fb]">
      <AppSidebar />
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
      <ToastContainer toasts={toasts} onRemove={onRemoveToast} />
    </div>
  );
}
