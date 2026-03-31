import { useState } from 'react';
import { api } from '@api/client';

const C = {
  amber: '#e8a849', amberDim: '#b8863a',
  text: 'rgb(245 240 228)', textSoft: 'rgb(176 170 160)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)', surface: 'rgb(20 20 23)', bg: 'rgb(10 10 12)',
  green: '#34d399', red: '#f87171',
};
const F = {
  display: "'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', monospace",
  sans: "'Inter', sans-serif",
};

interface TranslateResult {
  translated: number;
  failed: number;
  locale: string;
}

export interface CodexTranslateButtonProps {
  versionId: string;
  availableLocales: string[];
  baseLocale: string;
}

export function CodexTranslateButton({
  versionId,
  availableLocales,
  baseLocale,
}: CodexTranslateButtonProps) {
  const [open, setOpen] = useState(false);
  const [targetLocale, setTargetLocale] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Locales available as translation targets (exclude base)
  const targets = availableLocales.filter((l) => l !== baseLocale);

  const handleOpen = () => {
    setOpen(true);
    setResult(null);
    setError(null);
    setTargetLocale(targets[0] ?? '');
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    setError(null);
  };

  const handleTranslate = async () => {
    if (!targetLocale) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await api
        .post(`admin/codex/versions/${versionId}/translate`, {
          json: { targetLocale, sourceLocale: baseLocale },
        })
        .json<TranslateResult>();

      setResult(data);
    } catch {
      setError('Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-block', position: 'relative' }}>
      <button
        onClick={handleOpen}
        disabled={targets.length === 0}
        style={{
          padding: '3px 10px', borderRadius: 3,
          background: `${C.amber}1e`,
          border: `1px solid ${C.amber}4d`,
          color: C.amber,
          fontFamily: F.mono, fontSize: 10, cursor: targets.length === 0 ? 'not-allowed' : 'pointer',
          fontWeight: 700, letterSpacing: '0.04em',
          opacity: targets.length === 0 ? 0.5 : 1,
        }}
      >
        AI Translate
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 60,
          minWidth: 240, borderRadius: 6,
          border: `1px solid ${C.amber}4d`,
          background: C.bg,
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          padding: '14px 16px',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <span style={{
              fontFamily: F.display, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', color: C.amber, textTransform: 'uppercase',
            }}>
              AI Translate
            </span>
            <button
              onClick={handleClose}
              style={{
                background: 'none', border: 'none', color: C.textDim,
                cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px',
              }}
            >
              ×
            </button>
          </div>

          {/* Source info */}
          <div style={{
            fontFamily: F.mono, fontSize: 10, color: C.textDim, marginBottom: 10,
          }}>
            From <span style={{ color: C.textSoft, fontWeight: 700 }}>{baseLocale.toUpperCase()}</span> →
          </div>

          {/* Target locale selector */}
          <select
            value={targetLocale}
            onChange={(e) => { setTargetLocale(e.target.value); setResult(null); setError(null); }}
            disabled={loading}
            style={{
              width: '100%', background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 4,
              padding: '5px 8px', color: C.text,
              fontFamily: F.mono, fontSize: 11,
              cursor: 'pointer', marginBottom: 12,
            }}
          >
            {targets.map((l) => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>

          {/* Result / Error feedback */}
          {result && (
            <div style={{
              marginBottom: 10, padding: '6px 10px', borderRadius: 4,
              background: `${C.green}14`, border: `1px solid ${C.green}4d`,
              fontFamily: F.mono, fontSize: 10, color: C.green,
            }}>
              Translated {result.translated} {result.translated === 1 ? 'screen' : 'screens'} to {result.locale.toUpperCase()}
              {result.failed > 0 && (
                <span style={{ color: C.red }}> ({result.failed} failed)</span>
              )}
            </div>
          )}

          {error && (
            <div style={{
              marginBottom: 10, padding: '6px 10px', borderRadius: 4,
              background: `${C.red}14`, border: `1px solid ${C.red}4d`,
              fontFamily: F.mono, fontSize: 10, color: C.red,
            }}>
              {error}
            </div>
          )}

          {/* Translate button */}
          <button
            onClick={handleTranslate}
            disabled={loading || !targetLocale}
            style={{
              width: '100%', padding: '7px 12px', borderRadius: 4,
              background: loading
                ? `${C.amber}4d`
                : `linear-gradient(135deg, ${C.amber}, ${C.amberDim})`,
              border: 'none', color: '#0a0a0c',
              fontFamily: F.display, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.04em', cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Translating…' : 'Run Translation'}
          </button>
        </div>
      )}
    </div>
  );
}
