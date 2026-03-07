import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@lib/cn';

interface DecoInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  mono?: boolean;
}

export const DecoInput = forwardRef<HTMLInputElement, DecoInputProps>(
  ({ label, error, hint, mono, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded border border-deco-border bg-deco-bg px-3 py-2.5 text-[13px] text-deco-text placeholder:text-deco-text-dim',
            'focus:border-deco-amber/50 focus:outline-none transition-colors',
            mono && 'font-mono font-semibold',
            error && 'border-deco-red/50',
            className,
          )}
          {...props}
        />
        {error && <p className="font-mono text-[10px] text-deco-red">{error}</p>}
        {hint && !error && <p className="font-mono text-[10px] text-deco-text-dim">{hint}</p>}
      </div>
    );
  },
);

DecoInput.displayName = 'DecoInput';
