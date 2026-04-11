import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-legal-navy focus:ring-offset-2",
        {
          'border-transparent bg-legal-navy text-white hover:bg-legal-navy/80': variant === 'default',
          'border-transparent bg-legal-emerald text-white hover:bg-legal-emerald/80': variant === 'success',
          'border-transparent bg-amber-500 text-white hover:bg-amber-500/80': variant === 'warning',
          'border-transparent bg-red-600 text-white hover:bg-red-600/80': variant === 'danger',
          'text-legal-text': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}
