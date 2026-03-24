import { cn } from '@lib/cn';

interface DecoBadgeProps {
  variant?: 'green' | 'red' | 'amber' | 'purple' | 'teal' | 'muted';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  green: 'bg-deco-green/12 text-deco-green border-deco-green/30',
  red: 'bg-deco-red/12 text-deco-red border-deco-red/30',
  amber: 'bg-deco-amber/12 text-deco-amber border-deco-amber/30',
  purple: 'bg-deco-purple/12 text-deco-purple border-deco-purple/30',
  teal: 'bg-deco-teal/12 text-deco-teal border-deco-teal/30',
  muted: 'bg-deco-raised text-deco-text-dim border-deco-border',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[9px]',
  md: 'px-2.5 py-0.5 text-[10px]',
};

export function DecoBadge({ variant = 'muted', size = 'md', children, className }: DecoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border font-mono font-bold uppercase tracking-deco-wide',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
