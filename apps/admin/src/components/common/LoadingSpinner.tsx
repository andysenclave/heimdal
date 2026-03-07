import { cn } from '@lib/cn';

interface LoadingSpinnerProps {
  fullPage?: boolean;
  className?: string;
}

export function LoadingSpinner({ fullPage, className }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'h-8 w-8 rounded-full border-2 border-deco-amber border-t-transparent animate-deco-spin',
        className,
      )}
    />
  );

  if (fullPage) {
    return (
      <div className="flex h-screen items-center justify-center bg-deco-bg">{spinner}</div>
    );
  }

  return <div className="flex items-center justify-center p-12">{spinner}</div>;
}
