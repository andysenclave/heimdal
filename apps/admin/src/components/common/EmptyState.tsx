interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
}

export function EmptyState({
  title = 'No data',
  message = 'Nothing to display yet',
  icon = '◇',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-deco-border bg-deco-surface p-12 text-center shadow-deco-card">
      <span className="text-3xl text-deco-text-dim">{icon}</span>
      <h3 className="font-display text-sm font-bold tracking-deco-tight text-deco-text-soft">
        {title}
      </h3>
      <p className="font-mono text-xs text-deco-text-dim">{message}</p>
    </div>
  );
}
