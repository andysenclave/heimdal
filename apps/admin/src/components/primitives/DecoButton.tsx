import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@lib/cn';

interface DecoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

const variantStyles = {
  primary: 'bg-gradient-to-br from-deco-amber to-deco-amber-dim text-[#0A0A0C] font-bold shadow-deco-glow hover:opacity-90',
  secondary: 'bg-gradient-to-br from-deco-teal to-deco-teal/80 text-[#0A0A0C] font-bold hover:opacity-90',
  ghost: 'bg-transparent border border-deco-border text-deco-text-soft hover:bg-deco-surface-hover hover:text-deco-text',
  danger: 'bg-deco-red/10 border border-deco-red/30 text-deco-red hover:bg-deco-red/20',
};

const sizeStyles = {
  sm: 'px-2.5 py-1 text-[11px]',
  md: 'px-4 py-2 text-[13px]',
};

export const DecoButton = forwardRef<HTMLButtonElement, DecoButtonProps>(
  ({ variant = 'primary', size = 'md', className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded font-display tracking-deco-tight transition-all',
          variantStyles[variant],
          sizeStyles[size],
          disabled && 'pointer-events-none opacity-40',
          className,
        )}
        {...props}
      />
    );
  },
);

DecoButton.displayName = 'DecoButton';
