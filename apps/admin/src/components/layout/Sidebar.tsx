import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@lib/cn';
import { NAV_ITEMS } from '@lib/constants';
import { useAuth } from '@auth/hooks/useAuth';
import { DecoAvatar } from '@components/primitives';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        'relative flex shrink-0 flex-col border-r bg-deco-sidebar transition-[width] duration-200',
        'border-deco-border-copper',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      {/* Gradient accent line — top */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-deco-amber to-transparent" />

      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-2.5 border-b border-deco-border-dim',
          collapsed ? 'justify-center px-2.5 py-5' : 'px-4 py-5',
        )}
      >
        <div className="relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded bg-gradient-to-br from-deco-amber to-deco-copper">
          <span className="font-mono text-[15px] font-black text-[#0A0A0C]">H</span>
          {/* Mini L-bracket corners on logo */}
          <div className="absolute -left-px -top-px h-1.5 w-1.5 border-l-2 border-t-2 border-deco-amber" />
          <div className="absolute -bottom-px -right-px h-1.5 w-1.5 border-b-2 border-r-2 border-deco-amber" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-display text-[15px] font-bold tracking-deco-wider text-[#F5F0E4]">
              HEIMDAL
            </div>
            <div className="font-mono text-[9px] font-medium tracking-deco-widest text-deco-copper">
              ADMIN · PANEL
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 px-2 py-3.5">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-2.5 w-full rounded border border-deco-border bg-transparent px-1.5 py-1 font-mono text-[11px] text-[#888] hover:text-[#bbb] transition-colors"
        >
          {collapsed ? '▸' : '◂ collapse'}
        </button>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex w-full items-center rounded transition-all duration-150',
                collapsed ? 'justify-center py-2.5' : 'gap-2.5 px-3 py-2',
                isActive
                  ? 'border border-deco-copper/30 bg-deco-amber/12 font-semibold text-deco-amber'
                  : 'border border-transparent text-[#999] hover:text-[#ccc]',
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute bottom-[25%] left-0 top-[25%] w-0.5 rounded-sm bg-deco-amber" />
                )}
                <span
                  className={cn(
                    'w-5 shrink-0 text-center text-[13px]',
                    isActive ? 'opacity-100' : 'opacity-50',
                  )}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="text-[13px]">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile section */}
      <button
        onClick={() => navigate('/profile')}
        className={cn(
          'flex items-center gap-2 border-t border-deco-border-dim hover:bg-white/5 transition-colors',
          collapsed ? 'justify-center px-2 py-3.5' : 'px-3 py-3.5',
        )}
      >
        <DecoAvatar name={session?.name ?? session?.email ?? 'U'} size="sm" />
        {!collapsed && session && (
          <div className="text-left">
            <div className="text-[13px] font-semibold text-[#F5F0E4]">
              {session.name ?? session.email?.split('@')[0]}
            </div>
            <div className="font-mono text-[10px] text-deco-copper">
              {session.roles[0] ?? 'member'}
            </div>
          </div>
        )}
      </button>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-deco-copper/40 to-transparent" />
    </aside>
  );
}
