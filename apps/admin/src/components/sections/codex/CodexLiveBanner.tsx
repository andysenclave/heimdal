import { useState } from 'react';

const C = {
  green: '#34d399',
  textSoft: 'rgb(176 170 160)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)',
};
const F = { mono: "'JetBrains Mono', monospace" };

export interface CodexLiveBannerProps {
  appId: string;
}

export function CodexLiveBanner({ appId }: CodexLiveBannerProps) {
  const [copied, setCopied] = useState(false);
  const url = `GET /api/v1/codex/apps/${appId}/content?locale=en`;

  const copy = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
      .catch(() => null);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
      borderRadius: 4, border: `1px solid ${C.green}30`, background: `${C.green}08`, margin: '8px 0',
    }}>
      <span style={{ fontFamily: F.mono, fontSize: 9, color: C.green, fontWeight: 700, letterSpacing: '0.1em', flexShrink: 0 }}>LIVE</span>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
      <code style={{ flex: 1, fontFamily: F.mono, fontSize: 10, color: C.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {url}
      </code>
      <button
        onClick={copy}
        aria-label="Copy API endpoint"
        style={{
          padding: '2px 8px', borderRadius: 3,
          border: `1px solid ${copied ? C.green : C.border}`,
          background: copied ? `${C.green}14` : 'transparent',
          color: copied ? C.green : C.textDim,
          fontFamily: F.mono, fontSize: 10, cursor: 'pointer', flexShrink: 0,
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
