import { useState } from 'react';
import { useActiveApp } from '@/context/AppContext';
import { useCodexPage } from '@/hooks/useCodexPage';
import { CodexDialogProvider } from '@components/sections/codex/CodexDialogProvider';
import { CodexPageHeader } from '@components/sections/codex/CodexPageHeader';
import { CodexVersionBar } from '@components/sections/codex/CodexVersionBar';
import { CodexImageViewer } from '@components/sections/codex/CodexImageViewer';
import { CodexKeyEditor } from '@components/sections/codex/CodexKeyEditor';
import { CodexContentTree } from '@components/sections/codex/CodexContentTree';
import { CodexVersionHistory } from '@components/sections/codex/CodexVersionHistory';
import { CodexScreenStrip } from '@components/sections/codex/CodexScreenStrip';
import { CodexLiveBanner } from '@components/sections/codex/CodexLiveBanner';

const C = { amber: '#e8a849', teal: '#2dd4bf', textDim: 'rgb(107 102 96)' };
const F = { mono: "'JetBrains Mono', monospace" };

export default function Codex() {
  const { activeApp } = useActiveApp();
  const codex = useCodexPage(activeApp?.id ?? null);
  const [showHistory, setShowHistory] = useState(false);

  if (!activeApp) {
    return (
      <div>
        <CodexPageHeader showHistory={showHistory} onToggleHistory={() => setShowHistory((h) => !h)} />
        <div style={{
          padding: '10px 16px', borderRadius: 6, border: `1px solid ${C.amber}4d`,
          background: `${C.amber}08`, fontFamily: F.mono, fontSize: 12, color: C.amber, marginBottom: 12,
        }}>
          Select an application from the top bar to manage its content
        </div>
      </div>
    );
  }

  return (
    <CodexDialogProvider>
      <CodexPageHeader showHistory={showHistory} onToggleHistory={() => setShowHistory((h) => !h)} />

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <CodexVersionBar
            versions={codex.versions}
            activeVersionId={codex.activeVersionId ?? ''}
            onVersionChange={codex.handleVersionChange}
            activeLocale={codex.activeLocale}
            onLocaleChange={codex.setActiveLocale}
            locales={codex.locales}
            onSubmitReview={codex.handleSubmitReview}
            onApprove={codex.handleApprove}
            onReject={codex.handleReject}
            onNewVersion={() => codex.handleCreateVersion()}
            isCreating={codex.isCreatingVersion}
            onAddLocale={(locale, name) => codex.handleCreateLocale({ locale, name })}
          />

          {codex.hasPublished && activeApp.appId && <CodexLiveBanner appId={activeApp.appId} />}

          <CodexScreenStrip
            screens={codex.screens}
            activeId={codex.activeScreenId}
            onSelect={codex.handleScreenSelect}
            onAddScreen={codex.handleAddScreen}
            onDelete={codex.handleDeleteScreen}
            onReorder={codex.handleReorderScreens}
            isDraft={codex.isDraft}
          />

          {codex.activeScreen?.screenType && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                padding: '2px 6px', borderRadius: 3, background: `${C.teal}12`,
                border: `1px solid ${C.teal}30`, fontFamily: F.mono, fontSize: 9, color: C.teal,
              }}>{codex.activeScreen.screenType}</span>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textDim }}>
                {codex.regions.filter((r) => r.isConfirmed).length}/{codex.regions.length} confirmed
              </span>
            </div>
          )}

          <CodexImageViewer
            imageUrl={codex.activeScreen?.image?.originalUrl ? `/${codex.activeScreen.image.originalUrl}` : null}
            regions={codex.regions}
            selectedRegionId={codex.selectedRegionId}
            onRegionSelect={codex.setSelectedRegionId}
            onUpload={codex.isDraft ? codex.handleUpload : undefined}
            onAnalyze={codex.isDraft && codex.activeScreen?.image ? () => codex.handleAnalyze() : undefined}
            isAnalyzing={codex.isAnalyzing}
            isUploading={codex.isUploading}
          />

          <div style={{ marginTop: 10 }}>
            <CodexKeyEditor
              region={codex.selectedRegion}
              onConfirm={(id) => codex.handleConfirmRegion(id)}
              onIgnore={(id) => codex.handleIgnoreRegion(id)}
              onValueChange={codex.handleValueChange}
              isDraft={codex.isDraft}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <CodexContentTree
              tree={(codex.contentData?.contentTree as Record<string, unknown>) ?? {}}
              selectedKey={codex.selectedRegion?.contentKey ?? null}
              versionId={codex.activeVersionId ?? undefined}
              availableLocales={codex.locales.filter((l) => l.isActive).map((l) => l.locale)}
              baseLocale={codex.locales.find((l) => l.isBase)?.locale ?? 'en'}
            />
          </div>
        </div>

        {showHistory && (
          <div style={{ width: 280, flexShrink: 0 }}>
            <CodexVersionHistory
              versions={codex.versions}
              activeVersionId={codex.activeVersionId ?? ''}
              onSelect={codex.handleVersionChange}
              onRollback={codex.handleRollback}
              onDelete={codex.handleDeleteVersion}
            />
          </div>
        )}
      </div>
    </CodexDialogProvider>
  );
}
