import React from 'react';
import { cn } from '../../lib/utils';
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-legal-navy focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-legal-navy text-white hover:bg-legal-navy/90': variant === 'default',
            'bg-legal-emerald text-white hover:bg-legal-emerald/90': variant === 'secondary',
            'border border-legal-border bg-white hover:bg-legal-gray hover:text-legal-navy': variant === 'outline',
            'hover:bg-legal-gray hover:text-legal-navy': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-600/90': variant === 'danger',
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
