import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@lib/cn';

interface DecoSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const DecoSelect = forwardRef<HTMLSelectElement, DecoSelectProps>(
  ({ label, error, className, children, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full appearance-none rounded border border-deco-border bg-deco-raised px-3 py-2.5 pr-8 text-[12px] font-semibold text-deco-text',
              'focus:border-deco-amber/50 focus:outline-none transition-colors cursor-pointer',
              error && 'border-deco-red/50',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-deco-text-dim">
            ▾
          </span>
        </div>
        {error && <p className="font-mono text-[10px] text-deco-red">{error}</p>}
      </div>
    );
  },
);

DecoSelect.displayName = 'DecoSelect';
