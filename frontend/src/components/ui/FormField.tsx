import React from 'react';
import { cn } from '../../lib/utils';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  id: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, id, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        <label htmlFor={id} className="block text-xs font-medium text-text-secondary">
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          className={cn(
            'w-full h-10 px-3.5 bg-surface rounded-lg border text-sm text-text-primary placeholder:text-text-muted transition-colors',
            'border-border-default focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none',
            error && 'border-danger focus:border-danger focus:ring-danger',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />
        {error ? (
          <p id={`${id}-error`} className="text-xs text-danger font-medium mt-1">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${id}-helper`} className="text-xs text-text-muted mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
export default FormField;
