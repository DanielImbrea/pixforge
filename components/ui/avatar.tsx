import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
}

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, name, className }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('h-8 w-8 rounded-full object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'h-8 w-8 rounded-full bg-accent/10 text-accent text-xs font-medium flex items-center justify-center',
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
