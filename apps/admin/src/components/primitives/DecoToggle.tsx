import { cn } from '@lib/cn';

interface DecoToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function DecoToggle({ checked, onChange, disabled, className }: DecoToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-[38px] shrink-0 cursor-pointer rounded-full border transition-colors duration-200',
        checked
          ? 'border-deco-green/60 bg-deco-green/30'
          : 'border-deco-border bg-deco-raised',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-3.5 w-3.5 rounded-full transition-transform duration-200',
          checked
            ? 'translate-x-[18px] bg-deco-green'
            : 'translate-x-0.5 bg-deco-text-dim',
          'mt-px',
        )}
      />
    </button>
  );
}
