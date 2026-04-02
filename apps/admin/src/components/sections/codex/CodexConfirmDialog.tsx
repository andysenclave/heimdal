import { useEffect } from 'react';

const C = {
  amber: '#e8a849', copper: '#b87333',
  text: 'rgb(245 240 228)', textSoft: 'rgb(176 170 160)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)', surface: 'rgb(20 20 23)',
};
const F = {
  display: "'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const VARIANT_COLORS: Record<string, string> = {
  danger: '#f87171',
  success: '#4ade80',
  primary: C.amber,
};

export interface CodexConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CodexConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  isLoading = false,
}: CodexConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmColor = VARIANT_COLORS[confirmVariant] ?? C.amber;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 24,
          width: 400,
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 16px 64px rgba(0,0,0,0.85)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 style={{
          fontFamily: F.display, fontSize: 16, fontWeight: 700,
          color: C.text, margin: '0 0 10px', letterSpacing: '0.04em',
        }}>{title}</h2>

        {/* Message */}
        <p style={{
          fontFamily: F.mono, fontSize: 12, color: C.textSoft,
          margin: '0 0 20px', lineHeight: 1.6,
        }}>{message}</p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '6px 14px', borderRadius: 4,
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.textSoft, fontFamily: F.mono, fontSize: 11,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
            }}
          >Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 4, border: 'none',
              background: confirmColor,
              color: confirmVariant === 'danger' ? '#1a0a0a' : '#0a0a0c',
              fontFamily: F.mono, fontSize: 11, fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              letterSpacing: '0.04em',
            }}
          >
            {isLoading && (
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                border: '2px solid rgba(0,0,0,0.3)',
                borderTopColor: 'rgba(0,0,0,0.8)',
                display: 'inline-block',
                animation: 'confirmSpin 0.7s linear infinite',
              }} />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`@keyframes confirmSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
