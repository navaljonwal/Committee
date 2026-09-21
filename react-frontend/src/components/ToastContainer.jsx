import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-5 right-5 z-[10000] flex flex-col gap-2.5 pointer-events-none max-w-md w-full px-4 sm:px-0"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';
        const isInfo = t.type === 'info';
        const isSuccess = !isError && !isWarning && !isInfo;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white shadow-xl border transition-all duration-300 transform animate-popup-slide-in ${
              isError
                ? 'border-rose-200 shadow-rose-500/10'
                : isWarning
                ? 'border-amber-200 shadow-amber-500/10'
                : isInfo
                ? 'border-blue-200 shadow-blue-500/10'
                : 'border-emerald-200 shadow-emerald-500/10'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isError
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : isWarning
                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                  : isInfo
                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}
            >
              {isError && <AlertCircle className="w-4 h-4" />}
              {isWarning && <AlertTriangle className="w-4 h-4" />}
              {isInfo && <Info className="w-4 h-4" />}
              {isSuccess && <CheckCircle2 className="w-4 h-4" />}
            </div>

            <div className="flex-1 pt-0.5 min-w-0">
              {t.title && (
                <p className="text-xs font-bold text-slate-900 mb-0.5 truncate">
                  {t.title}
                </p>
              )}
              <p className="text-xs text-slate-700 font-medium leading-relaxed break-words">
                {t.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
