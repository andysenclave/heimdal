import { useState } from 'react';

const C = {
  amber: '#e8a849',
  text: 'rgb(245 240 228)', textDim: 'rgb(107 102 96)', textSoft: 'rgb(176 170 160)',
  border: 'rgb(42 42 48)', surface: 'rgb(20 20 23)',
};
const F = {
  display: "'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export interface CodexAddScreenModalProps {
  onSubmit: (name: string, slug: string) => void;
  onCancel: () => void;
}

export function CodexAddScreenModal({ onSubmit, onCancel }: CodexAddScreenModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const derivedSlug = slugify(name);
  const effectiveSlug = slugTouched ? slug : derivedSlug;

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !effectiveSlug.trim()) return;
    onSubmit(name.trim(), effectiveSlug.trim());
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Add new screen"
      onClick={onCancel}
    >
      <div
        style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: 24, width: 360, maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 16px 64px rgba(0,0,0,0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          fontFamily: F.display, fontSize: 16, fontWeight: 700,
          color: C.text, margin: '0 0 16px', letterSpacing: '0.04em',
        }}>New Screen</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontFamily: F.mono, fontSize: 10, color: C.textDim, marginBottom: 4, letterSpacing: '0.08em' }}>
              NAME
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Home Screen"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgb(10 10 12)', border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '7px 10px', color: C.text, fontFamily: F.mono, fontSize: 12,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontFamily: F.mono, fontSize: 10, color: C.textDim, marginBottom: 4, letterSpacing: '0.08em' }}>
              SLUG
            </label>
            <input
              value={effectiveSlug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="home-screen"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgb(10 10 12)', border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '7px 10px', color: C.amber, fontFamily: F.mono, fontSize: 12,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '6px 14px', borderRadius: 4,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.textSoft, fontFamily: F.mono, fontSize: 11, cursor: 'pointer',
              }}
            >Cancel</button>
            <button
              type="submit"
              disabled={!name.trim() || !effectiveSlug.trim()}
              style={{
                padding: '6px 14px', borderRadius: 4, border: 'none',
                background: `linear-gradient(135deg, ${C.amber}, #b87333)`,
                color: '#0a0a0c', fontFamily: F.mono, fontSize: 11,
                fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em',
              }}
            >Add Screen</button>
          </div>
        </form>
      </div>
    </div>
  );
}
