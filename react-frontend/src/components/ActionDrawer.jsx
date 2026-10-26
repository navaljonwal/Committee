import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ActionDrawer
 * A world-class responsive component:
 * - Mobile (< sm): Premium iOS/CRED style Bottom Sheet (slides up from bottom, thumb-friendly drag bar, rounded top)
 * - Desktop (>= sm): Sleek Slide-over Panel (slides in from right, leaves dashboard visible, rounded left)
 */
export default function ActionDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
  footer,
  maxWidth = 'sm:max-w-lg md:max-w-xl',
  headerActions,
  headerBg = 'bg-slate-50/70'
}) {
  // Close on ESC key and lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Blurred Dim Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Responsive Sheet (Mobile: Bottom Sheet | Desktop: Slide-over Drawer) */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[92dvh] flex flex-col shadow-2xl border-t border-slate-200/90 animate-sheet-up overflow-hidden sm:fixed sm:top-0 sm:bottom-0 sm:right-0 sm:inset-x-auto sm:rounded-none sm:rounded-l-3xl sm:max-h-full sm:border-t-0 sm:border-l sm:border-slate-200/90 sm:animate-drawer-right w-full ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Bar Drag Handle */}
        <div className="pt-2 pb-1 sm:hidden flex justify-center shrink-0 bg-white">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Pinned Header */}
        <div className={`shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 ${headerBg}`}>
          <div className="flex items-center gap-3 min-w-0 pr-2">
            {Icon && (
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200/70 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {title}
                </h3>
                {badge && <div>{badge}</div>}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-200 bg-white text-slate-400 shadow-2xs">
              ESC
            </kbd>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition active:scale-95"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col">
          {children}
        </div>

        {/* Optional Pinned Footer (Safe for Mobile Safe Area) */}
        {footer && (
          <div className="shrink-0 p-3.5 sm:p-5 border-t border-slate-100 bg-slate-50/80 pb-[max(env(safe-area-inset-bottom,0px),1rem)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
