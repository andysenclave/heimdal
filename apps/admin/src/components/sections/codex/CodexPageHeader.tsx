const C = {
  text: 'rgb(245 240 228)', textSoft: 'rgb(176 170 160)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)',
};
const F = {
  display: "'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export interface CodexPageHeaderProps {
  readonly showHistory: boolean;
  readonly onToggleHistory: () => void;
}

export function CodexPageHeader({ showHistory, onToggleHistory }: CodexPageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
      <div>
        <h1 style={{
          fontFamily: F.display, fontSize: 24, fontWeight: 700, letterSpacing: '0.04em',
          color: C.text, margin: 0,
        }}>Codex</h1>
        <p style={{ fontFamily: F.mono, fontSize: 12, color: C.textDim, margin: '4px 0 0' }}>
          Content management, translations &amp; publishing
        </p>
      </div>
      <button
        onClick={onToggleHistory}
        style={{
          padding: '5px 12px', borderRadius: 4, border: `1px solid ${C.border}`,
          background: 'transparent', color: C.textSoft, fontFamily: F.mono, fontSize: 11,
          cursor: 'pointer',
        }}
      >
        {showHistory ? 'Hide History' : 'Version History'}
      </button>
    </div>
  );
}
