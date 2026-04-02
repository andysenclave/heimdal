import { useState } from 'react';
import { useCodexDialog } from './CodexDialogProvider';

const C = {
  amber: '#e8a849',
  text: 'rgb(245 240 228)', textSoft: 'rgb(176 170 160)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)',
};
const F = {
  display: "'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

interface ScreenItem {
  id: string;
  slug: string;
  name: string;
  screenType?: string;
}

export interface CodexScreenStripProps {
  screens: ScreenItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAddScreen: (name: string, slug: string) => void;
  onDelete: (id: string, name: string) => void;
  onReorder: (ids: string[]) => void;
  isDraft: boolean;
}

export function CodexScreenStrip({
  screens, activeId, onSelect, onAddScreen, onDelete, onReorder, isDraft,
}: CodexScreenStripProps) {
  const { openDialog } = useCodexDialog();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleMove = (idx: number, direction: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    const newOrder = [...screens];
    const swapIdx = idx + direction;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    onReorder(newOrder.map((s) => s.id));
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    openDialog({
      type: 'confirm',
      title: `Delete "${name}"`,
      message: 'This will remove all its content and regions. This cannot be undone.',
      confirmLabel: 'Delete Screen',
      confirmVariant: 'danger',
      onConfirm: () => onDelete(id, name),
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0', overflowX: 'auto' }}>
      {screens.map((s, idx) => {
        const isActive = activeId === s.id;
        const isHovered = hoveredId === s.id;
        const canMoveLeft = isDraft && idx > 0;
        const canMoveRight = isDraft && idx < screens.length - 1;

        return (
          <div
            key={s.id}
            onMouseEnter={() => setHoveredId(s.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ position: 'relative', flexShrink: 0 }}
          >
            <button
              onClick={() => onSelect(s.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                borderRadius: 4,
                border: `1px solid ${isActive ? `${C.amber}60` : C.border}`,
                background: isActive ? `${C.amber}14` : 'transparent',
                cursor: 'pointer',
              }}
            >
              {isHovered && canMoveLeft && (
                <button
                  onClick={(e) => handleMove(idx, -1, e)}
                  title="Move left"
                  aria-label={`Move ${s.name} left`}
                  style={{
                    padding: '0 3px', border: 'none', background: 'transparent',
                    color: C.textDim, cursor: 'pointer', fontSize: 12, lineHeight: 1,
                  }}
                >&larr;</button>
              )}
              <span style={{
                fontFamily: F.display, fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? C.amber : C.textSoft, letterSpacing: '0.04em',
              }}>{s.name}</span>
              {isHovered && canMoveRight && (
                <button
                  onClick={(e) => handleMove(idx, 1, e)}
                  title="Move right"
                  aria-label={`Move ${s.name} right`}
                  style={{
                    padding: '0 3px', border: 'none', background: 'transparent',
                    color: C.textDim, cursor: 'pointer', fontSize: 12, lineHeight: 1,
                  }}
                >&rarr;</button>
              )}
              {!isHovered && <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.textDim, flexShrink: 0 }} />}
            </button>
            {isHovered && isDraft && (
              <button
                onClick={(e) => handleDelete(s.id, s.name, e)}
                title={`Delete ${s.name}`}
                aria-label={`Delete ${s.name}`}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 16, height: 16, borderRadius: '50%',
                  border: `1px solid ${C.border}`, background: 'rgb(20 20 23)',
                  color: C.textDim, cursor: 'pointer', fontSize: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1, padding: 0,
                }}
              >&times;</button>
            )}
          </div>
        );
      })}
      <button
        onClick={() => openDialog({ type: 'addScreen', onSubmit: onAddScreen })}
        disabled={!isDraft}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px',
          borderRadius: 4, border: `1px dashed ${C.border}`,
          background: 'transparent', cursor: isDraft ? 'pointer' : 'not-allowed',
          opacity: isDraft ? 1 : 0.4, flexShrink: 0,
        }}
      >
        <span style={{ color: C.amber, fontWeight: 700, fontSize: 12 }}>+</span>
        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textDim, letterSpacing: '0.06em' }}>Screen</span>
      </button>
    </div>
  );
}
