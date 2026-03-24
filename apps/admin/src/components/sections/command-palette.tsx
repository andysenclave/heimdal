import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@lib/cn';
import { ROUTES } from '@lib/constants';
import { queryKeys } from '@lib/queryKeys';
import type { Organization, Application, Role } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  category: string;
  action: () => void;
  icon?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Reset state on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Navigate + close helper
  const go = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose],
  );

  // Build command list from cached data + static navigation
  const allItems: CommandItem[] = [];

  // Navigation items
  const NAV_COMMANDS: CommandItem[] = [
    {
      id: 'nav-dashboard',
      label: 'Dashboard',
      category: 'Navigation',
      icon: '◈',
      action: () => go(ROUTES.DASHBOARD),
    },
    {
      id: 'nav-orgs',
      label: 'Organizations',
      category: 'Navigation',
      icon: '◇',
      action: () => go(ROUTES.ORGANIZATIONS),
    },
    {
      id: 'nav-users',
      label: 'Users',
      category: 'Navigation',
      icon: '⊕',
      action: () => go(ROUTES.USERS),
    },
    {
      id: 'nav-apps',
      label: 'Applications',
      category: 'Navigation',
      icon: '⬡',
      action: () => go(ROUTES.APPLICATIONS),
    },
    {
      id: 'nav-roles',
      label: 'Roles',
      category: 'Navigation',
      icon: '△',
      action: () => go(ROUTES.ROLES),
    },
    {
      id: 'nav-perms',
      label: 'Permissions',
      category: 'Navigation',
      icon: '◆',
      action: () => go(ROUTES.PERMISSIONS),
    },
    {
      id: 'nav-invites',
      label: 'Invites',
      category: 'Navigation',
      icon: '✉',
      action: () => go(ROUTES.INVITES),
    },
    {
      id: 'nav-audit',
      label: 'Audit Log',
      category: 'Navigation',
      icon: '≡',
      action: () => go(ROUTES.AUDIT_LOG),
    },
    {
      id: 'nav-guard',
      label: 'Guard Tester',
      category: 'Navigation',
      icon: '⊡',
      action: () => go(ROUTES.GUARD_TESTER),
    },
    {
      id: 'nav-profile',
      label: 'Profile',
      category: 'Navigation',
      icon: '○',
      action: () => go(ROUTES.PROFILE),
    },
  ];
  allItems.push(...NAV_COMMANDS);

  // Data from cache
  const orgsCache = queryClient.getQueryData<PaginatedResponse<Organization>>(
    queryKeys.orgs.all,
  );
  if (orgsCache?.data) {
    orgsCache.data.forEach((org) => {
      allItems.push({
        id: `org-${org.id}`,
        label: org.name,
        sublabel: org.slug,
        category: 'Organizations',
        icon: '◇',
        action: () => go(ROUTES.ORGANIZATIONS),
      });
    });
  }

  const appsCache = queryClient.getQueryData<PaginatedResponse<Application>>(
    queryKeys.apps.all,
  );
  if (appsCache?.data) {
    appsCache.data.forEach((app) => {
      allItems.push({
        id: `app-${app.id}`,
        label: app.name,
        sublabel: app.appId,
        category: 'Applications',
        icon: '⬡',
        action: () => go(ROUTES.APPLICATIONS),
      });
    });
  }

  const rolesCache = queryClient.getQueryData<PaginatedResponse<Role>>(
    queryKeys.roles.all,
  );
  if (rolesCache?.data) {
    rolesCache.data.forEach((role) => {
      allItems.push({
        id: `role-${role.id}`,
        label: role.name,
        sublabel: role.isSystem ? 'System role' : 'Custom role',
        category: 'Roles',
        icon: '△',
        action: () => go(ROUTES.ROLES),
      });
    });
  }

  // Filter by query
  const filtered = query
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          (item.sublabel && item.sublabel.toLowerCase().includes(query.toLowerCase())) ||
          item.category.toLowerCase().includes(query.toLowerCase()),
      )
    : allItems.slice(0, 20); // Show first 20 when no query

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Flat list for keyboard nav
  const flatItems = Object.values(grouped).flat();

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatItems[selectedIndex];
      if (selected) selected.action();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed left-1/2 top-[20vh] z-50 w-full max-w-[560px] -translate-x-1/2 overflow-hidden rounded-lg border border-deco-border bg-deco-surface shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-deco-border px-4 py-3">
          <span className="text-deco-text-dim">⌕</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, organizations, applications..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent font-mono text-[13px] text-deco-text placeholder:text-deco-text-dim focus:outline-none"
          />
          <span className="rounded border border-deco-border px-1.5 py-px font-mono text-[10px] text-deco-text-dim">
            ESC
          </span>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center font-mono text-[12px] text-deco-text-dim">
              No results for "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 pb-1 pt-2 font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
                  {category}
                </div>
                {items.map((item) => {
                  const itemIndex = flatItems.findIndex((i) => i.id === item.id);
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                        isSelected
                          ? 'bg-deco-amber/12 text-deco-amber'
                          : 'text-deco-text-soft hover:bg-deco-raised',
                      )}
                    >
                      <span className="w-5 text-center text-[13px] opacity-60">
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold">{item.label}</span>
                        {item.sublabel && (
                          <span className="block font-mono text-[10px] text-deco-text-dim">
                            {item.sublabel}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-[10px] text-deco-amber opacity-60">
                          ↵ enter
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-deco-border px-4 py-2">
          <span className="font-mono text-[10px] text-deco-text-dim">↑↓ navigate</span>
          <span className="font-mono text-[10px] text-deco-text-dim">↵ select</span>
          <span className="font-mono text-[10px] text-deco-text-dim">esc close</span>
        </div>
      </div>
    </>
  );
}
