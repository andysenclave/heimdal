import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCodexVersions, useCreateCodexVersion } from '@api/hooks/useCodexVersions';
import {
  useSubmitForReview,
  useApproveVersion,
  useRejectVersion,
  useRollbackVersion,
} from '@api/hooks/useCodexVersionActions';
import { useCodexScreens, useCreateCodexScreen } from '@api/hooks/useCodexScreens';
import { useCodexLocales, useCreateCodexLocale } from '@api/hooks/useCodexLocales';
import { useCodexRegions, useConfirmRegion, useIgnoreRegion } from '@api/hooks/useCodexRegions';
import { useCodexContent } from '@api/hooks/useCodexContent';
import { useActiveApp } from '@/context/AppContext';
import { CodexVersionBar } from '@components/sections/codex/CodexVersionBar';
import { CodexImageViewer } from '@components/sections/codex/CodexImageViewer';
import { CodexKeyEditor } from '@components/sections/codex/CodexKeyEditor';
import { CodexContentTree } from '@components/sections/codex/CodexContentTree';
import { CodexVersionHistory } from '@components/sections/codex/CodexVersionHistory';
import { tokenStore } from '@api/token-store';
import { queryKeys } from '@lib/query-keys';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  amber: '#e8a849', green: '#34d399', teal: '#2dd4bf',
  text: 'rgb(245 240 228)', textSoft: 'rgb(176 170 160)', textDim: 'rgb(107 102 96)',
  border: 'rgb(42 42 48)', surface: 'rgb(20 20 23)',
};
const F = {
  display: "'Space Grotesk', sans-serif",
  sans: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ── Screen pills strip ────────────────────────────────────────────────────────
function ScreenStrip({
  screens, activeId, onSelect, onAdd,
}: {
  screens: { id: string; slug: string; name: string; screenType?: string; _count?: { regions: number; contents: number } }[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0', overflowX: 'auto' }}>
      {screens.map((s) => {
        const isA = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
              borderRadius: 4,
              border: `1px solid ${isA ? `${C.amber}60` : C.border}`,
              background: isA ? `${C.amber}14` : 'transparent',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <span style={{
              fontFamily: F.display, fontSize: 12,
              fontWeight: isA ? 700 : 500,
              color: isA ? C.amber : C.textSoft, letterSpacing: '0.04em',
            }}>{s.name}</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.textDim, flexShrink: 0 }} />
          </button>
        );
      })}
      <button
        onClick={onAdd}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px',
          borderRadius: 4, border: `1px dashed ${C.border}`,
          background: 'transparent', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <span style={{ color: C.amber, fontWeight: 700, fontSize: 12 }}>+</span>
        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textDim, letterSpacing: '0.06em' }}>Screen</span>
      </button>
    </div>
  );
}

// ── Add Screen Modal ──────────────────────────────────────────────────────────
function AddScreenModal({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string, slug: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const derivedSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-'),
      );
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    onSubmit(name.trim(), slug.trim());
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
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
              value={slugTouched ? slug : derivedSlug}
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
              disabled={!name.trim() || !(slugTouched ? slug : derivedSlug).trim()}
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

// ── Live endpoint banner ──────────────────────────────────────────────────────
function LiveBanner({ appId }: { appId: string }) {
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

// ── Main Codex page ───────────────────────────────────────────────────────────
export default function Codex() {
  const { activeApp } = useActiveApp();
  const activeAppId = activeApp?.id ?? null;
  const activeAppPublicId = activeApp?.appId ?? null;
  const queryClient = useQueryClient();

  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState('en');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Real data hooks — only enabled when app is selected
  const { data: versionsData } = useCodexVersions(activeAppId);
  const { data: localesData } = useCodexLocales(activeAppId);
  const { data: screensData } = useCodexScreens(activeVersionId);
  const { data: regionsData } = useCodexRegions(activeScreenId);
  const { data: contentData } = useCodexContent(activeScreenId, activeLocale);

  const { mutate: createVersion } = useCreateCodexVersion(activeAppId ?? '');
  const { mutate: submitReview } = useSubmitForReview(activeAppId ?? '');
  const { mutate: approveVersion } = useApproveVersion(activeAppId ?? '');
  const { mutate: rejectVersion } = useRejectVersion(activeAppId ?? '');
  const { mutate: rollbackVersion } = useRollbackVersion(activeAppId ?? '');
  const { mutate: confirmRegion } = useConfirmRegion(activeScreenId ?? '');
  const { mutate: ignoreRegion } = useIgnoreRegion(activeScreenId ?? '');
  const { mutate: createLocale } = useCreateCodexLocale(activeAppId ?? '');

  const versions = versionsData?.data ?? [];
  const locales = localesData ?? [];
  const screens = screensData ?? [];
  const regions = regionsData ?? [];
  const resolvedVersionId = activeVersionId ?? versions[0]?.id ?? null;

  const { mutate: createScreen } = useCreateCodexScreen(resolvedVersionId ?? '');

  const selectedRegion = regions.find((r) => r.id === selectedRegionId) ?? null;

  const handleVersionChange = useCallback((id: string) => {
    setActiveVersionId(id);
    setActiveScreenId(null);
    setSelectedRegionId(null);
  }, []);

  const handleScreenSelect = useCallback((id: string) => {
    setActiveScreenId(id);
    setSelectedRegionId(null);
  }, []);

  const handleAddScreen = useCallback((name: string, slug: string) => {
    createScreen({ name, slug }, {
      onSuccess: () => setShowAddScreen(false),
    });
  }, [createScreen]);

  const handleUpload = useCallback(async (file: File) => {
    if (!activeScreenId) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await fetch(`/api/v1/admin/codex/screens/${activeScreenId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenStore.getAccessToken()}` },
        body: formData,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.screens(resolvedVersionId ?? '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.screen(activeScreenId) });
    } catch {
      // silent for now — will surface via image not appearing
    }
  }, [activeScreenId, resolvedVersionId, queryClient]);

  const handleAnalyze = useCallback(async () => {
    if (!activeScreenId) return;
    setIsAnalyzing(true);
    try {
      await fetch(`/api/v1/admin/codex/screens/${activeScreenId}/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenStore.getAccessToken()}` },
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.regions(activeScreenId) });
    } catch {
      // no-op
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeScreenId, queryClient]);

  const hasPublished = versions.some((v) => v.status === 'PUBLISHED');
  const activeScreen = screens.find((s) => s.id === activeScreenId);

  // Page header — always shown
  const header = (
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
        onClick={() => setShowHistory(!showHistory)}
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

  // Early return when no app is selected
  if (!activeAppId) {
    return (
      <div>
        {header}
        <div style={{
          padding: '10px 16px', borderRadius: 6, border: `1px solid ${C.amber}4d`,
          background: `${C.amber}08`, fontFamily: F.mono, fontSize: 12, color: C.amber,
          marginBottom: 12,
        }}>
          Select an application from the top bar to manage its content
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Version bar */}
          <CodexVersionBar
            versions={versions}
            activeVersionId={resolvedVersionId ?? ''}
            onVersionChange={handleVersionChange}
            activeLocale={activeLocale}
            onLocaleChange={setActiveLocale}
            locales={locales}
            onSubmitReview={() => resolvedVersionId && submitReview({ versionId: resolvedVersionId })}
            onApprove={() => resolvedVersionId && approveVersion(resolvedVersionId)}
            onReject={() =>
              resolvedVersionId &&
              rejectVersion({ versionId: resolvedVersionId, feedback: 'Rejected via admin UI' })
            }
            onNewVersion={() => createVersion({ cloneFromLatest: true })}
            onAddLocale={(locale, name) => createLocale({ locale, name })}
          />

          {/* Live endpoint banner */}
          {hasPublished && activeAppPublicId && <LiveBanner appId={activeAppPublicId} />}

          {/* Screen strip */}
          <ScreenStrip
            screens={screens}
            activeId={activeScreenId}
            onSelect={handleScreenSelect}
            onAdd={() => setShowAddScreen(true)}
          />

          {/* Screen info */}
          {activeScreen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {activeScreen.screenType && (
                <span style={{
                  padding: '2px 6px', borderRadius: 3, background: `${C.teal}12`,
                  border: `1px solid ${C.teal}30`, fontFamily: F.mono, fontSize: 9, color: C.teal,
                }}>{activeScreen.screenType}</span>
              )}
              <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textDim }}>
                {regions.filter((r) => r.isConfirmed).length}/{regions.length} confirmed
              </span>
            </div>
          )}

          {/* Image viewer */}
          <CodexImageViewer
            imageUrl={activeScreen?.image?.originalUrl ? `/${activeScreen.image.originalUrl}` : null}
            regions={regions}
            selectedRegionId={selectedRegionId}
            onRegionSelect={setSelectedRegionId}
            onUpload={handleUpload}
            onAnalyze={activeScreen?.image ? handleAnalyze : undefined}
            isAnalyzing={isAnalyzing}
          />

          {/* Key editor */}
          <div style={{ marginTop: 10 }}>
            <CodexKeyEditor
              region={selectedRegion}
              onConfirm={(id) => confirmRegion(id)}
              onIgnore={(id) => ignoreRegion(id)}
            />
          </div>

          {/* Content tree */}
          <div style={{ marginTop: 10 }}>
            <CodexContentTree
              tree={(contentData?.contentTree as Record<string, unknown>) ?? {}}
              selectedKey={selectedRegion ? selectedRegion.contentKey : null}
            />
          </div>
        </div>

        {/* Version history sidebar */}
        {showHistory && (
          <div style={{ width: 280, flexShrink: 0 }}>
            <CodexVersionHistory
              versions={versions}
              activeVersionId={resolvedVersionId ?? ''}
              onSelect={handleVersionChange}
              onRollback={(id) => rollbackVersion(id)}
            />
          </div>
        )}
      </div>

      {/* Add screen modal */}
      {showAddScreen && (
        <AddScreenModal
          onSubmit={handleAddScreen}
          onCancel={() => setShowAddScreen(false)}
        />
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
