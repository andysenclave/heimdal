import { cn } from '@lib/cn';

interface DecoAvatarProps {
  name: string;
  image?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function DecoAvatar({ name, image, size = 'md', className }: DecoAvatarProps) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={cn('rounded-full object-cover', sizeStyles[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-deco-amber to-deco-copper font-mono font-bold text-[#0A0A0C]',
        sizeStyles[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
