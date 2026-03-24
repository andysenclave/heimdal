import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@lib/cn';

interface DecoTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const DecoTextarea = forwardRef<HTMLTextAreaElement, DecoTextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded border border-deco-border bg-deco-bg px-3 py-2.5 text-[13px] text-deco-text placeholder:text-deco-text-dim',
            'focus:border-deco-amber/50 focus:outline-none transition-colors min-h-[80px] resize-y',
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

DecoTextarea.displayName = 'DecoTextarea';
