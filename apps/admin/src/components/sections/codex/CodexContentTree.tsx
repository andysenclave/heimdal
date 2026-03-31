import { useState } from 'react';
import { CodexTranslateButton } from './CodexTranslateButton';

const C = {
  amber: '#e8a849', teal: '#2dd4bf', purple: '#a78bfa',
  text: 'rgb(245 240 228)', textSoft: 'rgb(176 170 160)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)', surface: 'rgb(20 20 23)',
};
const F = {
  display: "'Space Grotesk', sans-serif",
  sans: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

function TreeNode({
  k, v, path, depth, selectedKey,
}: {
  k: string;
  v: unknown;
  path: string;
  depth: number;
  selectedKey?: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const isObj = v !== null && typeof v === 'object' && !Array.isArray(v);
  const hl = selectedKey != null && path === selectedKey;

  return (
    <div>
      <div
        onClick={() => isObj && setCollapsed(!collapsed)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0',
          paddingLeft: depth * 16,
          background: hl ? `${C.amber}14` : 'transparent',
          borderLeft: hl ? `2px solid ${C.amber}` : '2px solid transparent',
          cursor: isObj ? 'pointer' : 'default',
        }}
      >
        {isObj
          ? (
            <span style={{
              color: C.textDim, fontSize: 10, width: 14, textAlign: 'center',
              fontFamily: 'monospace',
            }}>{collapsed ? '▸' : '▾'}</span>
          )
          : <span style={{ width: 14 }} />}
        <span style={{ fontFamily: F.mono, fontSize: 11, color: isObj ? C.teal : C.amber }}>{k}</span>
        {!isObj && (
          <>
            <span style={{ color: C.textDim, fontFamily: 'monospace', fontSize: 11 }}>:</span>
            <span style={{
              fontFamily: F.sans, fontSize: 11, color: C.textSoft,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260,
            }}>"{String(v)}"</span>
          </>
        )}
      </div>
      {isObj && !collapsed && Object.entries(v as Record<string, unknown>).map(([ck, cv]) => (
        <TreeNode key={ck} k={ck} v={cv} path={`${path}.${ck}`} depth={depth + 1} selectedKey={selectedKey} />
      ))}
    </div>
  );
}

export interface CodexContentTreeProps {
  tree: Record<string, unknown>;
  selectedKey?: string | null;
  onTranslate?: () => void;
  versionId?: string;
  availableLocales?: string[];
  baseLocale?: string;
}

export function CodexContentTree({
  tree,
  selectedKey,
  onTranslate,
  versionId,
  availableLocales,
  baseLocale,
}: CodexContentTreeProps) {
  const copyJson = () => navigator.clipboard.writeText(JSON.stringify(tree, null, 2)).catch(() => null);

  const showTranslateButton =
    versionId !== undefined &&
    availableLocales !== undefined &&
    availableLocales.length > 0 &&
    baseLocale !== undefined;

  return (
    <div style={{ position: 'relative', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${C.amber}4d`, padding: '10px 16px',
      }}>
        <h3 style={{
          display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.display,
          fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: C.text, margin: 0,
        }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, transform: 'rotate(45deg)', background: C.amber }} />
          Content Tree
        </h3>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={copyJson}
            style={{
              padding: '3px 8px', borderRadius: 3, background: 'transparent',
              border: `1px solid ${C.border}`, color: C.textSoft,
              fontFamily: F.mono, fontSize: 10, cursor: 'pointer',
            }}
          >Copy JSON</button>
          {onTranslate && (
            <button
              onClick={onTranslate}
              style={{
                padding: '3px 8px', borderRadius: 3, background: `${C.purple}1e`,
                border: `1px solid ${C.purple}4d`, color: C.purple,
                fontFamily: F.mono, fontSize: 10, cursor: 'pointer', fontWeight: 700,
              }}
            >AI Translate</button>
          )}
          {showTranslateButton && (
            <CodexTranslateButton
              versionId={versionId!}
              availableLocales={availableLocales!}
              baseLocale={baseLocale!}
            />
          )}
        </div>
      </div>
      <div style={{ padding: '8px 12px', maxHeight: 220, overflowY: 'auto' }}>
        {Object.entries(tree).map(([k, v]) => (
          <TreeNode key={k} k={k} v={v} path={k} depth={0} selectedKey={selectedKey} />
        ))}
      </div>
    </div>
  );
}
