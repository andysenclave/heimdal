import { useCallback, useRef, useState } from 'react';
import type { CodexRegion } from '@api/codex-types';

const C = {
  amber: '#e8a849', teal: '#2dd4bf', green: '#34d399', red: '#f87171', purple: '#a78bfa',
  text: 'rgb(245 240 228)', textSoft: 'rgb(176 170 160)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)', surface: 'rgb(20 20 23)', bg: 'rgb(10 10 12)',
};
const F = {
  display: "'Space Grotesk', sans-serif",
  sans: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const ROLE_COLORS: Record<string, string> = {
  heading: C.amber, subheading: '#b8863a', label: C.teal, body: C.textSoft,
  button: C.green, link: C.purple, caption: C.textDim,
};

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role] ?? C.textDim;
  return (
    <span style={{
      padding: '1px 6px', borderRadius: 3, background: `${c}18`, color: c,
      border: `1px solid ${c}30`, fontFamily: F.mono, fontSize: 9, fontWeight: 600,
      textTransform: 'uppercase' as const, letterSpacing: '0.1em',
    }}>
      {role}
    </span>
  );
}

export interface CodexKeyEditorProps {
  region: CodexRegion | null;
  onConfirm: (id: string) => void;
  onIgnore: (id: string) => void;
  onValueChange: (regionId: string, newValue: string) => void;
  isDraft: boolean;
}

export function CodexKeyEditor({ region, onConfirm, onIgnore, onValueChange, isDraft }: CodexKeyEditorProps) {
  const [isDirty, setIsDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setIsDirty(true);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (region) onValueChange(region.id, newValue);
      }, 300);
    },
    [region, onValueChange],
  );

  if (!region) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, border: `1px dashed ${C.border}`, borderRadius: 6,
        color: C.textDim, fontFamily: F.mono, fontSize: 12,
      }}>
        Click a region above to edit its key and value
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative', borderRadius: 6, border: `1px solid ${C.border}`,
      background: C.surface, padding: 16,
    }}>
      <div style={{
        borderBottom: `1px solid ${C.amber}4d`, paddingBottom: 10, marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, transform: 'rotate(45deg)', background: C.amber }} />
        <h3 style={{
          fontFamily: F.display, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
          color: C.text, margin: 0,
        }}>Key Editor</h3>
        {!isDraft && (
          <span style={{
            marginLeft: 'auto', padding: '1px 6px', borderRadius: 3,
            background: `${C.textDim}18`, border: `1px solid ${C.textDim}30`,
            fontFamily: F.mono, fontSize: 9, color: C.textDim, letterSpacing: '0.08em',
          }}>READ ONLY</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{
            fontFamily: F.mono, fontSize: 9, textTransform: 'uppercase' as const,
            letterSpacing: '0.1em', color: C.textDim, marginBottom: 4, display: 'block',
          }}>Key Path</label>
          <div style={{
            padding: '6px 10px', borderRadius: 4, border: `1px solid ${C.border}`,
            background: C.bg, fontFamily: F.mono, fontSize: 13, color: C.amber,
          }}>
            {region.contentKey}
          </div>
        </div>

        <div>
          <label style={{
            fontFamily: F.mono, fontSize: 9, textTransform: 'uppercase' as const,
            letterSpacing: '0.1em', color: C.textDim, marginBottom: 4, display: 'block',
          }}>
            Value <span style={{ color: C.teal }}>(extracted)</span>
            {isDirty && isDraft && (
              <span style={{ marginLeft: 6, color: C.amber, fontSize: 11 }}>•</span>
            )}
          </label>
          <input
            key={region.id}
            defaultValue={region.extractedText ?? ''}
            onChange={handleChange}
            disabled={!isDraft}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 4,
              border: `1px solid ${isDirty && isDraft ? `${C.amber}60` : C.border}`,
              background: C.bg,
              fontFamily: F.sans, fontSize: 13, color: isDraft ? C.text : C.textDim,
              outline: 'none', boxSizing: 'border-box' as const,
              cursor: isDraft ? 'text' : 'not-allowed',
              opacity: isDraft ? 1 : 0.6,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
          {region.semanticRole && <RoleBadge role={region.semanticRole} />}
          {region.confidence != null && (
            <span style={{
              fontFamily: F.mono, fontSize: 10,
              color: region.confidence > 0.9 ? C.green : C.amber,
            }}>
              {Math.round(region.confidence * 100)}%
            </span>
          )}
          <div style={{ flex: 1 }} />
          {!region.isConfirmed ? (
            <button
              onClick={() => onConfirm(region.id)}
              style={{
                padding: '3px 8px', borderRadius: 3, background: `${C.teal}14`,
                border: `1px solid ${C.teal}4d`, color: C.teal,
                fontFamily: F.mono, fontSize: 10, cursor: 'pointer', fontWeight: 700,
              }}
            >✓ Confirm</button>
          ) : (
            <span style={{
              padding: '3px 8px', borderRadius: 3, background: `${C.green}12`,
              border: `1px solid ${C.green}30`, fontFamily: F.mono, fontSize: 9, color: C.green,
            }}>✓ CONFIRMED</span>
          )}
          <button
            onClick={() => onIgnore(region.id)}
            style={{
              padding: '3px 8px', borderRadius: 3, background: `${C.red}14`,
              border: `1px solid ${C.red}4d`, color: C.red,
              fontFamily: F.mono, fontSize: 10, cursor: 'pointer', fontWeight: 700,
            }}
          >Ignore</button>
        </div>
      </div>
    </div>
  );
}
