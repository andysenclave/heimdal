import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@hooks/useTheme';
import { useOrganizations } from '@api/hooks/useOrganizations';
import { useActiveOrg } from '@/context/OrgContext';
import { useAuth } from '@auth/hooks/useAuth';
import { NAV_ITEMS } from '@lib/constants';
import type { Organization } from '@/types/models';

interface TopBarProps {
  onSearchClick?: () => void;
}

export function TopBar({ onSearchClick }: TopBarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { activeOrg, setActiveOrg } = useActiveOrg();
  const { data: orgsData } = useOrganizations();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const orgs = orgsData?.data ?? [];

  const currentPage = NAV_ITEMS.find((item) =>
    item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path),
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOrgDropdownOpen(false);
      }
    }
    if (orgDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [orgDropdownOpen]);

  const handleOrgSelect = (org: Organization) => {
    setActiveOrg(org);
    setOrgDropdownOpen(false);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-deco-border bg-deco-surface px-6">
      {/* Page title */}
      <h2 className="font-display text-[17px] font-bold tracking-deco-tight text-deco-text">
        {currentPage?.label ?? 'Heimdal'}
      </h2>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 rounded border border-deco-border bg-deco-raised px-3 py-1.5 font-mono text-xs font-semibold text-deco-text-soft transition-colors hover:text-deco-text"
        >
          <span className="text-sm">{theme === 'dark' ? '☽' : '☀'}</span>
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>

        {/* Org switcher */}
        {isAuthenticated && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOrgDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded border border-deco-border bg-deco-raised px-3 py-1.5 font-mono text-xs font-semibold transition-colors hover:border-deco-amber/40 hover:text-deco-amber"
              style={{
                color: activeOrg ? 'rgb(var(--color-amber))' : 'rgb(var(--color-text-dim))',
              }}
            >
              <span>◇</span>
              <span>{activeOrg?.name ?? 'Select Org'}</span>
              <span className="text-[10px]">{orgDropdownOpen ? '▴' : '▾'}</span>
            </button>

            {orgDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded border border-deco-border bg-deco-surface shadow-lg">
                {orgs.length === 0 ? (
                  <div className="px-3 py-2 font-mono text-[11px] text-deco-text-dim">
                    No organizations
                  </div>
                ) : (
                  orgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSelect(org)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[12px] transition-colors hover:bg-deco-amber/8 ${
                        activeOrg?.id === org.id
                          ? 'text-deco-amber'
                          : 'text-deco-text-soft'
                      }`}
                    >
                      {activeOrg?.id === org.id && <span className="text-[10px]">✓</span>}
                      {activeOrg?.id !== org.id && <span className="w-[14px]" />}
                      <span className="font-semibold">{org.name}</span>
                      <span className="ml-auto rounded bg-deco-bg px-1.5 py-px text-[9px] text-deco-text-dim">
                        {org.plan ?? 'free'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div
          onClick={onSearchClick}
          className="flex w-[200px] cursor-pointer items-center gap-1.5 rounded border border-deco-border bg-deco-raised px-3 py-1.5 font-mono text-xs text-deco-text-dim hover:border-deco-amber/40 transition-colors"
        >
          <span>⌕</span>
          <span>search...</span>
          <span className="ml-auto rounded bg-deco-surface px-1.5 py-px text-[10px] text-deco-text-dim">
            ⌘K
          </span>
        </div>
      </div>
    </header>
  );
}
