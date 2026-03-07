import type { ReactNode } from 'react';
import { cn } from '@lib/cn';

interface DecoCardProps {
  title?: string;
  className?: string;
  children: ReactNode;
  noPadding?: boolean;
}

export function DecoCard({ title, className, children, noPadding }: DecoCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-md border border-deco-border bg-deco-surface shadow-deco-card',
        className,
      )}
    >
      {/* L-bracket corners */}
      <div className="pointer-events-none absolute left-1.5 top-1.5 h-3 w-3 border-l border-t border-deco-copper/40" />
      <div className="pointer-events-none absolute right-1.5 top-1.5 h-3 w-3 border-r border-t border-deco-copper/40" />
      <div className="pointer-events-none absolute bottom-1.5 left-1.5 h-3 w-3 border-b border-l border-deco-copper/40" />
      <div className="pointer-events-none absolute bottom-1.5 right-1.5 h-3 w-3 border-b border-r border-deco-copper/40" />

      {title && (
        <div className="border-b border-deco-amber/30 px-5 py-3">
          <h3 className="flex items-center gap-2 font-display text-[13px] font-bold tracking-deco-tight text-deco-text">
            <span className="inline-block h-1.5 w-1.5 rotate-45 bg-deco-amber" />
            {title}
          </h3>
        </div>
      )}
      <div className={cn(!noPadding && 'p-5')}>
        {children}
      </div>
    </div>
  );
}
