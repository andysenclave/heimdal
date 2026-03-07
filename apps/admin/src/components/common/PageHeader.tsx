import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-deco-tight text-deco-text">
          {title}
        </h1>
        {subtitle && <p className="mt-1 font-mono text-xs text-deco-text-dim">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
