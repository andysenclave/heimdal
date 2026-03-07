import { cn } from '@lib/cn';

interface DecoPillProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function DecoPill({ active, onClick, children, className }: DecoPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] font-semibold transition-colors',
        active
          ? 'border-deco-amber/40 bg-deco-amber/10 text-deco-amber shadow-deco-glow'
          : 'border-deco-border bg-transparent text-deco-text-dim hover:text-deco-text-soft',
        className,
      )}
    >
      {children}
    </button>
  );
}
