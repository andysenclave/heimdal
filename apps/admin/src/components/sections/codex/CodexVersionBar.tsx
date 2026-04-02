import { useState, useRef, useEffect } from 'react';
import type { CodexVersion, CodexLocale } from '@api/codex-types';
import { useCodexDialog } from './CodexDialogProvider';

const C = {
  amber: '#e8a849', amberDim: '#b8863a', copper: '#b87333',
  teal: '#2dd4bf', green: '#34d399', red: '#f87171', purple: '#a78bfa',
  text: 'rgb(245 240 228)', textSoft: 'rgb(176 170 160)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)', surface: 'rgb(20 20 23)', bg: 'rgb(10 10 12)',
};
const F = {
  display: "'Space Grotesk', sans-serif",
  sans: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: C.amber, REVIEW: C.purple, PUBLISHED: C.green, ARCHIVED: C.textDim,
};

function Badge({ status, glow }: { status: string; glow?: boolean }) {
  const c = STATUS_COLORS[status] ?? C.textDim;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4, border: `1px solid ${c}4d`, background: `${c}1e`,
      fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: c,
      textTransform: 'uppercase' as const, letterSpacing: '0.08em', flexShrink: 0,
      animation: glow ? 'statusGlow 1.2s ease-out forwards' : undefined,
    }}>{status}</span>
  );
}

function Btn({
  children, v = 'ghost', onClick, sm, disabled,
}: {
  children: React.ReactNode;
  v?: string;
  onClick?: () => void;
  sm?: boolean;
  disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: `linear-gradient(135deg, ${C.amber}, ${C.copper})`, color: '#0a0a0c', border: 'none', fontWeight: 700 },
    approve: { background: `linear-gradient(135deg, ${C.green}, ${C.teal})`, color: '#0a0a0c', border: 'none', fontWeight: 700 },
    purple: { background: `${C.purple}1e`, border: `1px solid ${C.purple}4d`, color: C.purple, fontWeight: 700 },
    danger: { background: `${C.red}14`, border: `1px solid ${C.red}4d`, color: C.red, fontWeight: 700 },
    ghost: { background: 'transparent', border: `1px solid ${C.border}`, color: C.textSoft, fontWeight: 600 },
    teal: { background: `${C.teal}14`, border: `1px solid ${C.teal}4d`, color: C.teal, fontWeight: 700 },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 4,
        padding: sm ? '3px 8px' : '5px 12px',
        fontFamily: F.display, fontSize: sm ? 10 : 12, cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        ...(styles[v] ?? styles.ghost),
      }}
    >{children}</button>
  );
}

// ── Add Locale inline form ─────────────────────────────────────────────────────
function AddLocaleForm({ onAdd }: { onAdd: (locale: string, name: string) => void }) {
  const [locale, setLocale] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locale.trim() || !name.trim()) {
      setError('Both fields are required');
      return;
    }
    if (!/^[a-z]{2,5}$/.test(locale.trim())) {
      setError('Locale must be 2–5 lowercase letters');
      return;
    }
    setError('');
    onAdd(locale.trim(), name.trim());
    setLocale('');
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '8px 12px' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          value={locale}
          onChange={(e) => { setLocale(e.target.value.toLowerCase()); setError(''); }}
          placeholder="fr"
          maxLength={5}
          style={{
            width: 40, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 3,
            padding: '4px 6px', color: C.amber, fontFamily: F.mono, fontSize: 11,
            outline: 'none',
          }}
        />
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="French"
          style={{
            flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 3,
            padding: '4px 6px', color: C.textSoft, fontFamily: F.mono, fontSize: 11,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '4px 10px', borderRadius: 3, border: 'none',
            background: `linear-gradient(135deg, ${C.amber}, ${C.copper})`,
            color: '#0a0a0c', fontFamily: F.mono, fontSize: 11,
            fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}
        >Add</button>
      </div>
      {error && (
        <p style={{ fontFamily: F.mono, fontSize: 9, color: C.red, margin: '4px 0 0', letterSpacing: '0.04em' }}>
          {error}
        </p>
      )}
    </form>
  );
}

export interface CodexVersionBarProps {
  versions: CodexVersion[];
  activeVersionId: string;
  onVersionChange: (id: string) => void;
  activeLocale: string;
  onLocaleChange: (code: string) => void;
  locales: CodexLocale[];
  onSubmitReview: (notes?: string) => void;
  onApprove: () => void;
  onReject: (feedback: string) => void;
  onNewVersion?: () => void;
  isCreating?: boolean;
  onAddLocale?: (locale: string, name: string) => void;
}

export function CodexVersionBar({
  versions, activeVersionId, onVersionChange,
  activeLocale, onLocaleChange, locales,
  onSubmitReview, onApprove, onReject, onNewVersion,
  isCreating = false,
  onAddLocale,
}: CodexVersionBarProps) {
  const { openDialog } = useCodexDialog();
  const [locOpen, setLocOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const [statusGlow, setStatusGlow] = useState(false);

  const active = versions.find((v) => v.id === activeVersionId);
  const cur = locales.find((l) => l.locale === activeLocale);

  // Track status changes and trigger glow animation
  useEffect(() => {
    const currentStatus = active?.status;
    if (prevStatusRef.current !== undefined && prevStatusRef.current !== currentStatus) {
      setStatusGlow(true);
      const t = setTimeout(() => setStatusGlow(false), 1200);
      return () => clearTimeout(t);
    }
    prevStatusRef.current = currentStatus;
  }, [active?.status]);

  useEffect(() => {
    if (!locOpen) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setLocOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [locOpen]);

  // Format a date string to a readable form
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
      {/* Controls row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 0',
        overflow: 'hidden', flexWrap: 'wrap',
      }}>
        <select
          value={activeVersionId}
          onChange={(e) => onVersionChange(e.target.value)}
          style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4,
            padding: '4px 6px', color: C.text, fontFamily: F.mono, fontSize: 11,
            cursor: 'pointer', width: 64, flexShrink: 0,
          }}
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>v{v.version}</option>
          ))}
        </select>
        {active && <Badge status={active.status} glow={statusGlow} />}

        {/* Locale dropdown */}
        <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setLocOpen(!locOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
              borderRadius: 4, border: `1px solid ${C.border}`, background: 'transparent',
              cursor: 'pointer', fontFamily: F.mono, fontSize: 11, color: C.textSoft,
            }}
          >
            <span style={{ color: C.amber, fontWeight: 700 }}>{activeLocale.toUpperCase()}</span>
            <span style={{ fontSize: 10 }}>{cur?.name}</span>
            {cur?.isBase && <span style={{ fontSize: 8, color: C.green, fontWeight: 700 }}>BASE</span>}
            <span style={{ fontSize: 9, color: C.textDim }}>{locOpen ? '▴' : '▾'}</span>
          </button>
          {locOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
              minWidth: 220, borderRadius: 6, border: `1px solid ${C.border}`,
              background: C.surface, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', overflow: 'hidden',
            }}>
              {locales.map((l) => (
                <button
                  key={l.locale}
                  onClick={() => { onLocaleChange(l.locale); setLocOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 12px', border: 'none',
                    background: activeLocale === l.locale ? `${C.amber}14` : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    fontFamily: F.mono, fontSize: 11, fontWeight: 700,
                    color: activeLocale === l.locale ? C.amber : C.textSoft, width: 22,
                  }}>{l.locale.toUpperCase()}</span>
                  <span style={{ fontFamily: F.sans, fontSize: 12, color: C.textSoft, flex: 1 }}>{l.name}</span>
                  {l.isBase && <span style={{ fontFamily: F.mono, fontSize: 8, color: C.green, fontWeight: 700 }}>BASE</span>}
                  {activeLocale === l.locale && <span style={{ color: C.amber, fontSize: 10 }}>✓</span>}
                </button>
              ))}
              {/* Divider */}
              <div style={{ height: 1, background: 'rgb(42 42 48)', margin: '4px 0' }} />
              {/* Inline add form */}
              <AddLocaleForm onAdd={(locale, name) => { onAddLocale?.(locale, name); setLocOpen(false); }} />
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {active?.status === 'DRAFT' && (
          <Btn v="purple" onClick={() => openDialog({
            type: 'review',
            mode: 'submit',
            versionNumber: active.version,
            onSubmit: (notes) => onSubmitReview(notes || undefined),
          })}>Submit for Review</Btn>
        )}
        {active?.status === 'REVIEW' && (
          <>
            <Btn v="danger" onClick={() => openDialog({
              type: 'review',
              mode: 'reject',
              versionNumber: active.version,
              onSubmit: (feedback) => onReject(feedback),
            })}>Reject</Btn>
            <Btn v="approve" onClick={() => openDialog({
              type: 'confirm',
              title: 'Approve & Publish',
              message: `Publishing v${active.version} will make it the active version. The current published version (if any) will be archived.`,
              confirmLabel: 'Approve & Publish',
              confirmVariant: 'success',
              onConfirm: () => onApprove(),
            })}>Approve &amp; Publish</Btn>
          </>
        )}
        <Btn v="primary" onClick={onNewVersion} disabled={isCreating}>
          {isCreating ? 'Creating...' : '+ New Version'}
        </Btn>
      </div>

      {/* Task 4.5: Status banners for non-DRAFT versions */}
      {active?.status === 'REVIEW' && (
        <div style={{
          padding: '6px 12px', borderRadius: 4, marginTop: 6,
          border: '1px solid rgba(139, 92, 246, 0.3)',
          background: 'rgba(139, 92, 246, 0.06)',
          fontFamily: F.mono, fontSize: 11, color: '#a78bfa',
        }}>
          This version is under review. Editing is locked.
        </div>
      )}
      {active?.status === 'PUBLISHED' && (
        <div style={{
          padding: '6px 12px', borderRadius: 4, marginTop: 6,
          border: `1px solid ${C.green}30`,
          background: `${C.green}08`,
          fontFamily: F.mono, fontSize: 11, color: C.green,
        }}>
          This version is live.
        </div>
      )}
      {active?.status === 'ARCHIVED' && (
        <div style={{
          padding: '6px 12px', borderRadius: 4, marginTop: 6,
          border: `1px solid ${C.textDim}30`,
          background: `${C.textDim}08`,
          fontFamily: F.mono, fontSize: 11, color: C.textDim,
        }}>
          This version is archived.
        </div>
      )}

      {/* Task 4.7: Review metadata */}
      {active?.reviewedBy && active.reviewedAt && active.status !== 'DRAFT' && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', marginTop: 4,
          fontFamily: F.mono, fontSize: 10, color: C.textDim,
        }}>
          <span>
            {active.status === 'PUBLISHED' ? 'Published by' : 'Reviewed by'}{' '}
            <span style={{ color: C.textSoft }}>{active.reviewedBy.name ?? active.reviewedBy.email}</span>
            {' on '}
            <span style={{ color: C.textSoft }}>{fmtDate(active.reviewedAt)}</span>
          </span>
        </div>
      )}

      {/* Glow keyframe */}
      <style>{`
        @keyframes statusGlow {
          0%   { box-shadow: 0 0 0 0 rgba(232, 168, 73, 0.4); }
          50%  { box-shadow: 0 0 12px 4px rgba(232, 168, 73, 0.2); }
          100% { box-shadow: 0 0 0 0 rgba(232, 168, 73, 0); }
        }
      `}</style>
    </div>
  );
}
