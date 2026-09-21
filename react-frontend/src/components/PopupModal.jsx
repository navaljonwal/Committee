import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export default function PopupModal({ modalState, onConfirm, onCancel }) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (modalState?.open) {
      // Focus confirm button when modal opens
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [modalState?.open, onCancel]);

  if (!modalState || !modalState.open) return null;

  const {
    type = 'info',
    title = 'Confirm Action',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isAlert = false
  } = modalState;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';
  const isSuccess = type === 'success';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-modal-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-200 animate-popup-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / Close */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${
              isDanger
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : isWarning
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : isSuccess
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-orange-50 border-orange-200 text-orange-600'
            }`}
          >
            {isDanger && <Trash2 className="w-6 h-6" />}
            {isWarning && <AlertTriangle className="w-6 h-6" />}
            {isSuccess && <CheckCircle2 className="w-6 h-6" />}
            {!isDanger && !isWarning && !isSuccess && <Info className="w-6 h-6" />}
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-4 space-y-2">
          <h3
            id="popup-modal-title"
            className="text-lg sm:text-xl font-black text-slate-900 tracking-tight"
          >
            {title}
          </h3>
          <div className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">
            {message}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 pt-0 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-3">
          {!isAlert && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300 text-xs sm:text-sm font-semibold transition active:scale-[0.98]"
            >
              {cancelText}
            </button>
          )}

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-lg transition duration-150 active:scale-[0.98] ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                : isSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/25'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
