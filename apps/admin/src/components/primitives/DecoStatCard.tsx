import type { ReactNode } from 'react';
import { cn } from '@lib/cn';

interface DecoStatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: 'amber' | 'teal' | 'green' | 'purple' | 'red';
  className?: string;
}

const accentBg = {
  amber: 'bg-deco-amber/12',
  teal: 'bg-deco-teal/12',
  green: 'bg-deco-green/12',
  purple: 'bg-deco-purple/12',
  red: 'bg-deco-red/12',
};

const accentText = {
  amber: 'text-deco-amber',
  teal: 'text-deco-teal',
  green: 'text-deco-green',
  purple: 'text-deco-purple',
  red: 'text-deco-red',
};

const accentGlow = {
  amber: 'bg-deco-amber/8',
  teal: 'bg-deco-teal/8',
  green: 'bg-deco-green/8',
  purple: 'bg-deco-purple/8',
  red: 'bg-deco-red/8',
};

export function DecoStatCard({ label, value, icon, accent = 'amber', className }: DecoStatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-deco-border bg-deco-surface p-5 shadow-deco-card',
        className,
      )}
    >
      {/* L-bracket corners */}
      <div className="pointer-events-none absolute left-1.5 top-1.5 h-3 w-3 border-l border-t border-deco-copper/40" />
      <div className="pointer-events-none absolute right-1.5 top-1.5 h-3 w-3 border-r border-t border-deco-copper/40" />
      <div className="pointer-events-none absolute bottom-1.5 left-1.5 h-3 w-3 border-b border-l border-deco-copper/40" />
      <div className="pointer-events-none absolute bottom-1.5 right-1.5 h-3 w-3 border-b border-r border-deco-copper/40" />

      {/* Ambient glow blob */}
      <div className={cn('pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full blur-xl', accentGlow[accent])} />

      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-deco-tight text-deco-text-dim">{label}</p>
          <p className={cn('mt-1 font-mono text-3xl font-extrabold', accentText[accent])}>{value}</p>
        </div>
        {icon && (
          <div className={cn('flex h-7 w-7 items-center justify-center rounded', accentBg[accent])}>
            <span className={cn('text-sm', accentText[accent])}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}
