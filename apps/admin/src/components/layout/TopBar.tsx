import { useLocation } from 'react-router-dom';
import { useTheme } from '@hooks/useTheme';
import { NAV_ITEMS } from '@lib/constants';

export function TopBar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const currentPage = NAV_ITEMS.find((item) =>
    item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path),
  );

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

        {/* Org switcher placeholder */}
        <div className="rounded border border-deco-border bg-deco-raised px-3 py-1.5 font-mono text-xs font-semibold text-deco-text-soft">
          Thimple
        </div>

        {/* Search */}
        <div className="flex w-[200px] items-center gap-1.5 rounded border border-deco-border bg-deco-raised px-3 py-1.5 font-mono text-xs text-deco-text-dim">
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
