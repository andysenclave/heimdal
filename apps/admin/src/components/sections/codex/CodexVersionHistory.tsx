import { useState } from 'react';
import { formatRelative } from '@lib/format';
import type { CodexVersion } from '@api/codex-types';
import { useCodexDialog } from './CodexDialogProvider';

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
  onDelete?: (id: string) => void;
}

export function CodexVersionHistory({
  versions, activeVersionId, onSelect, onRollback, onDelete,
}: CodexVersionHistoryProps) {
  const { openDialog } = useCodexDialog();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
          const isHovered = hoveredId === v.id;
          return (
            <div
              key={v.id}
              onMouseEnter={() => setHoveredId(v.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex', gap: 12, padding: '8px 16px', position: 'relative',
                borderLeft: isActive ? `2px solid ${C.amber}` : '2px solid transparent',
                transition: 'border-color 0.15s',
              }}
            >
              {!isLast && (
                <div style={{
                  position: 'absolute', left: 21, top: 24, width: 1, bottom: -8, background: C.border,
                }} />
              )}
              <StatusDot status={v.status} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  {v.status === 'DRAFT' && onDelete && isHovered && (
                    <button
                      onClick={() => openDialog({
                        type: 'confirm',
                        title: `Delete v${v.version}`,
                        message: 'This will permanently delete this draft version and all its content. This cannot be undone.',
                        confirmLabel: 'Delete Version',
                        confirmVariant: 'danger',
                        onConfirm: () => onDelete(v.id),
                      })}
                      title="Delete version"
                      aria-label={`Delete version ${v.version}`}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        padding: '2px 4px', color: C.red, fontSize: 14, lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >&times;</button>
                  )}
                </div>
                {v.description && (
                  <p style={{
                    fontFamily: F.sans, fontSize: 11, color: C.textDim, margin: '2px 0 0',
                  }}>{v.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textDim }}>
                    {formatRelative(v.createdAt)}
                  </span>
                  {v.status === 'ARCHIVED' && onRollback && (
                    <button
                      onClick={() => openDialog({
                        type: 'confirm',
                        title: 'Rollback Version',
                        message: `This will archive the current published version and restore v${v.version}.`,
                        confirmLabel: 'Rollback',
                        confirmVariant: 'danger',
                        onConfirm: () => onRollback(v.id),
                      })}
                      style={{
                        padding: '1px 6px', borderRadius: 3, background: 'transparent',
                        border: `1px solid ${C.amber}4d`, color: C.amber,
                        fontFamily: F.mono, fontSize: 9, cursor: 'pointer',
                      }}
                    >Rollback</button>
                  )}
                </div>
                {/* Task 4.7: Review metadata */}
                {v.reviewedBy && v.reviewedAt && (
                  <div style={{ marginTop: 3, fontFamily: F.mono, fontSize: 9, color: C.textDim }}>
                    {v.status === 'PUBLISHED' ? 'Published by' : 'Reviewed by'}{' '}
                    <span style={{ color: C.textSoft }}>{v.reviewedBy.name ?? v.reviewedBy.email}</span>
                    {' · '}
                    {new Date(v.reviewedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                )}
                {v.publishedAt && v.status === 'PUBLISHED' && !v.reviewedBy && (
                  <div style={{ marginTop: 3, fontFamily: F.mono, fontSize: 9, color: C.green }}>
                    Live since {new Date(v.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
