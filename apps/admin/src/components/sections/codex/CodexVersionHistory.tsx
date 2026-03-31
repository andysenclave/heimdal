import type { CodexVersion } from '@api/codex-types';

const C = {
  amber: '#e8a849', green: '#34d399', red: '#f87171', purple: '#a78bfa',
  text: 'rgb(245 240 228)', textSoft: 'rgb(176 170 160)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)', surface: 'rgb(20 20 23)',
};
const F = {
  display: "'Space Grotesk', sans-serif",
  sans: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: C.amber, REVIEW: C.purple, PUBLISHED: C.green, ARCHIVED: C.textDim,
};

function StatusDot({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? C.textDim;
  return (
    <span style={{
      width: 8, height: 8, borderRadius: '50%', background: c,
      flexShrink: 0, marginTop: 4,
    }} />
  );
}

export interface CodexVersionHistoryProps {
  versions: CodexVersion[];
  activeVersionId: string;
  onSelect: (id: string) => void;
  onRollback?: (id: string) => void;
}

export function CodexVersionHistory({
  versions, activeVersionId, onSelect, onRollback,
}: CodexVersionHistoryProps) {
  return (
    <div style={{ borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface }}>
      <div style={{ borderBottom: `1px solid ${C.amber}4d`, padding: '10px 16px' }}>
        <h3 style={{
          fontFamily: F.display, fontSize: 13, fontWeight: 700, color: C.text, margin: 0,
        }}>Version History</h3>
      </div>
      <div style={{ padding: '8px 0', maxHeight: 300, overflowY: 'auto' }}>
        {versions.map((v, i) => {
          const isActive = v.id === activeVersionId;
          const isLast = i === versions.length - 1;
          return (
            <div key={v.id} style={{ display: 'flex', gap: 12, padding: '8px 16px', position: 'relative' }}>
              {!isLast && (
                <div style={{
                  position: 'absolute', left: 19, top: 24, width: 1, bottom: -8, background: C.border,
                }} />
              )}
              <StatusDot status={v.status} />
              <div style={{ flex: 1 }}>
                <button
                  onClick={() => onSelect(v.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, padding: 0,
                  }}
                >
                  <span style={{
                    fontFamily: F.mono, fontSize: 12, fontWeight: 700,
                    color: isActive ? C.amber : C.textSoft,
                  }}>v{v.version}</span>
                  <span style={{
                    padding: '1px 6px', borderRadius: 3,
                    border: `1px solid ${(STATUS_COLORS[v.status] ?? C.textDim)}4d`,
                    background: `${(STATUS_COLORS[v.status] ?? C.textDim)}12`,
                    fontFamily: F.mono, fontSize: 9,
                    color: STATUS_COLORS[v.status] ?? C.textDim,
                  }}>{v.status}</span>
                </button>
                {v.description && (
                  <p style={{
                    fontFamily: F.sans, fontSize: 11, color: C.textDim, margin: '2px 0 0',
                  }}>{v.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textDim }}>
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                  {v.status === 'ARCHIVED' && onRollback && (
                    <button
                      onClick={() => onRollback(v.id)}
                      style={{
                        padding: '1px 6px', borderRadius: 3, background: 'transparent',
                        border: `1px solid ${C.amber}4d`, color: C.amber,
                        fontFamily: F.mono, fontSize: 9, cursor: 'pointer',
                      }}
                    >Rollback</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
