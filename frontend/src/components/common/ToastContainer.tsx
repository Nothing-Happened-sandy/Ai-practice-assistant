import React from 'react';
import { ToastMessage } from '../../types';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
        };

        const bgBorders = {
          success: 'bg-white dark:bg-slate-900 border-emerald-500/30 text-emerald-950 dark:text-emerald-100',
          error: 'bg-white dark:bg-slate-900 border-rose-500/30 text-rose-950 dark:text-rose-100',
          warning: 'bg-white dark:bg-slate-900 border-amber-500/30 text-amber-950 dark:text-amber-100',
          info: 'bg-white dark:bg-slate-900 border-indigo-500/30 text-indigo-950 dark:text-indigo-100',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all transform translate-y-0 opacity-100 ${bgBorders[toast.type]}`}
          >
            <div className="flex items-center space-x-2.5">
              {icons[toast.type]}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-2"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
