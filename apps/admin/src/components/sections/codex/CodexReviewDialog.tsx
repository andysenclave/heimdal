import { useState, useEffect } from 'react';

const C = {
  amber: '#e8a849', copper: '#b87333', red: '#f87171', purple: '#a78bfa',
  text: 'rgb(245 240 228)', textSoft: 'rgb(176 170 160)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)', surface: 'rgb(20 20 23)', bg: 'rgb(10 10 12)',
};
const F = {
  display: "'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export interface CodexReviewDialogProps {
  open: boolean;
  mode: 'submit' | 'reject';
  versionNumber: number;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CodexReviewDialog({
  open,
  mode,
  versionNumber,
  onSubmit,
  onCancel,
  isLoading = false,
}: CodexReviewDialogProps) {
  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState('');

  // Reset text when dialog opens
  useEffect(() => {
    if (open) {
      setText('');
      setValidationError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const isSubmitMode = mode === 'submit';
  const title = isSubmitMode ? `Submit v${versionNumber} for Review` : `Reject v${versionNumber}`;
  const placeholder = isSubmitMode
    ? 'Add notes for the reviewer (optional)'
    : 'Provide feedback for the author';
  const confirmLabel = isSubmitMode ? 'Submit for Review' : 'Reject';
  const confirmColor = isSubmitMode ? C.purple : C.red;
  const confirmTextColor = '#1a0a0a';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmitMode && !text.trim()) {
      setValidationError('Feedback is required before rejecting');
      return;
    }
    setValidationError('');
    onSubmit(text.trim());
  };

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
          width: 440,
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 16px 64px rgba(0,0,0,0.85)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 style={{
          fontFamily: F.display, fontSize: 16, fontWeight: 700,
          color: C.text, margin: '0 0 16px', letterSpacing: '0.04em',
        }}>{title}</h2>

        <form onSubmit={handleSubmit}>
          {/* Textarea */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontFamily: F.mono, fontSize: 10,
              color: C.textDim, marginBottom: 6, letterSpacing: '0.08em',
            }}>
              {isSubmitMode ? 'NOTES (OPTIONAL)' : 'FEEDBACK (REQUIRED)'}
            </label>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => { setText(e.target.value); if (validationError) setValidationError(''); }}
              placeholder={placeholder}
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: C.bg,
                border: validationError
                  ? `1px solid ${C.red}`
                  : `1px solid ${C.border}`,
                borderRadius: 4,
                padding: '8px 10px',
                color: C.text,
                fontFamily: F.mono, fontSize: 12,
                resize: 'vertical',
                outline: 'none',
                lineHeight: 1.6,
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => {
                if (!validationError) {
                  e.currentTarget.style.borderColor = C.amber;
                }
              }}
              onBlur={(e) => {
                if (!validationError) {
                  e.currentTarget.style.borderColor = C.border;
                }
              }}
            />
            {validationError && (
              <p style={{
                fontFamily: F.mono, fontSize: 10, color: C.red,
                margin: '4px 0 0', letterSpacing: '0.04em',
              }}>{validationError}</p>
            )}
          </div>

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
              type="submit"
              disabled={isLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 4, border: 'none',
                background: confirmColor,
                color: confirmTextColor,
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
                  animation: 'reviewSpin 0.7s linear infinite',
                }} />
              )}
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes reviewSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
