import { Link } from 'react-router-dom';
import { ROUTES } from '@lib/constants';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-deco-bg">
      <h1 className="font-display text-6xl font-bold tracking-deco-tight text-deco-amber">404</h1>
      <p className="font-mono text-sm text-deco-text-soft">Page not found</p>
      <Link
        to={ROUTES.DASHBOARD}
        className="mt-4 rounded border border-deco-border bg-deco-raised px-4 py-2 font-mono text-xs text-deco-text-soft hover:bg-deco-surface-hover"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
