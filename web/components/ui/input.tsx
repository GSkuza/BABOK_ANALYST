import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, helperText, type = 'text', ...props }, ref) => (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base placeholder:text-slate-500 transition-colors',
          'focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
          'dark:bg-slate-950 dark:border-slate-800 dark:text-slate-50 dark:placeholder:text-slate-400',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-600 dark:text-slate-400">{helperText}</p>}
    </div>
  )
);

Input.displayName = 'Input';

export { Input };
