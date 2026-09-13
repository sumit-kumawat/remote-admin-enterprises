import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let border = 'border-slate-300 bg-white text-slate-800';
        let Icon = Info;
        let iconColor = 'text-blue-600';

        if (toast.type === 'success') {
          border = 'border-emerald-300 bg-emerald-50 text-emerald-950';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-600';
        } else if (toast.type === 'error') {
          border = 'border-rose-300 bg-rose-50 text-rose-950';
          Icon = XCircle;
          iconColor = 'text-rose-600';
        } else if (toast.type === 'warning') {
          border = 'border-amber-300 bg-amber-50 text-amber-950';
          Icon = AlertTriangle;
          iconColor = 'text-amber-600';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 border rounded-md shadow-md text-xs font-sans animate-in slide-in-from-bottom-2 ${border}`}
          >
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs leading-none mb-1">{toast.title}</div>
              {toast.message && <div className="text-xs leading-normal opacity-90">{toast.message}</div>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss toast notification"
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded focus:outline-none"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
