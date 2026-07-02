import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200',
        secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
        success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        error: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
        outline: 'border border-current',
      },
      size: {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, size, ...props }, ref) => (
  <div ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />
));

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
