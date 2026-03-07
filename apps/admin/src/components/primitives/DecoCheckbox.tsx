import { cn } from '@lib/cn';

interface DecoCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  inherited?: boolean;
  className?: string;
}

export function DecoCheckbox({ checked, onChange, label, inherited, className }: DecoCheckboxProps) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2', className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
          checked
            ? inherited
              ? 'border-deco-purple/50 bg-deco-purple/20 text-deco-purple'
              : 'border-deco-amber/50 bg-deco-amber/20 text-deco-amber'
            : 'border-deco-border bg-deco-raised',
        )}
      >
        {checked && <span className="text-[10px]">&#10003;</span>}
      </button>
      {label && (
        <span className="font-mono text-[11px] text-deco-text-soft">{label}</span>
      )}
    </label>
  );
}
