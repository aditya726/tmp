import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import type { Toast as ToastType } from '../../hooks/useToast';

const iconMap = {
  success: <CheckCircle size={16} className="text-green-600" />,
  error: <XCircle size={16} className="text-red-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  info: <Info size={16} className="text-blue-500" />,
};

const bgMap = {
  success: 'bg-white border-green-200 shadow-green-50',
  error: 'bg-white border-red-200 shadow-red-50',
  warning: 'bg-white border-amber-200 shadow-amber-50',
  info: 'bg-white border-blue-200 shadow-blue-50',
};

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg min-w-[280px] max-w-sm animate-slide-in-up ${bgMap[toast.type]}`}
    >
      <div className="mt-0.5 shrink-0">{iconMap[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-500 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
