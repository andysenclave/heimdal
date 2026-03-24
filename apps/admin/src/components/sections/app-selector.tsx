import { useState, useRef, useEffect } from 'react';
import { useApplications } from '@api/hooks/useApplications';
import { useActiveApp } from '@/context/AppContext';
import { useActiveOrg } from '@/context/OrgContext';
import { cn } from '@lib/cn';
import type { Application } from '@/types/models';

/**
 * Application scope selector — rendered on pages that need per-app filtering
 * (Roles, Permissions). Mirrors the org selector in TopBar.
 *
 * - Platform/org admins: interactive dropdown, persisted per-org via AppContext
 * - Org members: read-only label (app is auto-bound from their OrgMembership)
 */
export function AppSelector() {
  const { activeOrg } = useActiveOrg();
  const { activeApp, setActiveApp, clearActiveApp, isAppFixed } = useActiveApp();
  const { data: appsData } = useApplications(activeOrg?.id);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const apps = appsData?.data ?? [];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Auto-select when there's exactly one app and none is selected
  useEffect(() => {
    if (!isAppFixed && !activeApp && apps.length === 1 && apps[0]) {
      setActiveApp(apps[0]);
    }
  }, [apps, activeApp, isAppFixed, setActiveApp]);

  const handleSelect = (app: Application) => {
    setActiveApp(app);
    setOpen(false);
  };

  const label = activeApp?.name ?? 'Select App';
  const hasSelection = !!activeApp;

  // ── Read-only pill for org members ──────────────────────────────────────────
  if (isAppFixed) {
    return (
      <div
        title={activeApp ? `App ID: ${activeApp.appId}` : undefined}
        className="flex w-[180px] items-center gap-1.5 rounded border border-deco-border bg-deco-raised px-3 py-1.5 font-mono text-xs font-semibold cursor-default select-none"
        style={{ color: hasSelection ? 'rgb(var(--color-teal))' : 'rgb(var(--color-text-dim))' }}
      >
        <span className="shrink-0 text-[11px] opacity-60">⬡</span>
        <span className="flex-1 truncate text-left">{label}</span>
        <span className="shrink-0 text-[9px] text-deco-text-dim" title="Fixed by your org membership">
          ◈
        </span>
      </div>
    );
  }

  // ── Interactive dropdown for admins ─────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!activeOrg}
        className={cn(
          'flex w-[180px] items-center gap-1.5 rounded border bg-deco-raised px-3 py-1.5 font-mono text-xs font-semibold transition-colors',
          !activeOrg
            ? 'cursor-not-allowed border-deco-border text-deco-text-dim/40'
            : open || hasSelection
            ? 'border-deco-teal/40 text-deco-teal hover:border-deco-teal/60'
            : 'border-deco-border text-deco-text-dim hover:border-deco-teal/40 hover:text-deco-teal',
        )}
      >
        <span className="shrink-0 text-[11px] opacity-70">⬡</span>
        <span className="flex-1 truncate text-left">{label}</span>
        <span className="shrink-0 text-[10px]">{open ? '▴' : '▾'}</span>
      </button>

      {open && activeOrg && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[220px] rounded border border-deco-border bg-deco-surface shadow-xl">
          {/* Header */}
          <div className="border-b border-deco-border-dim px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-deco-widest text-deco-text-dim">
              Application
            </span>
          </div>

          {/* App list */}
          <div className="max-h-[220px] overflow-y-auto py-1">
            {apps.length === 0 ? (
              <div className="px-3 py-3 font-mono text-[11px] text-deco-text-dim">
                No applications in this org
              </div>
            ) : (
              apps.map((app) => {
                const isActive = activeApp?.id === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => handleSelect(app)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'bg-deco-teal/8 text-deco-teal'
                        : 'text-deco-text-soft hover:bg-deco-surface-hover hover:text-deco-text',
                    )}
                  >
                    {/* Active indicator */}
                    <span className={cn('shrink-0 text-[10px]', isActive ? 'opacity-100' : 'opacity-0')}>
                      ◈
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[12px] font-semibold">{app.name}</span>
                      <span className="font-mono text-[10px] text-deco-text-dim">{app.appId}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Clear selection */}
          {hasSelection && (
            <div className="border-t border-deco-border-dim px-3 py-1.5">
              <button
                onClick={() => {
                  clearActiveApp();
                  setOpen(false);
                }}
                className="font-mono text-[10px] text-deco-text-dim hover:text-deco-text-soft transition-colors"
              >
                — clear selection (show all)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
