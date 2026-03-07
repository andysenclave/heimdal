import { useEffect, type ReactNode } from 'react';
import { cn } from '@lib/cn';

interface DecoModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

export function DecoModal({ open, onClose, title, wide, children, footer }: DecoModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[4px]"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={cn(
          'relative max-h-[85vh] overflow-auto rounded-lg border border-deco-border bg-deco-surface p-6 shadow-deco-modal animate-deco-modal-enter',
          wide ? 'w-full max-w-[700px]' : 'w-full max-w-[480px]',
        )}
      >
        {/* Gradient accent line */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-lg bg-gradient-to-r from-transparent via-deco-amber to-transparent" />

        {/* L-bracket corners */}
        <div className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-deco-copper/40" />
        <div className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-deco-copper/40" />
        <div className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-deco-copper/40" />
        <div className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-deco-copper/40" />

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-[17px] font-bold tracking-deco-tight text-deco-text">
            <span className="inline-block h-2 w-2 rotate-45 bg-deco-amber" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded border border-deco-border bg-deco-raised text-deco-text-dim hover:text-deco-text transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-5 flex justify-end gap-2 border-t border-deco-border-dim pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
