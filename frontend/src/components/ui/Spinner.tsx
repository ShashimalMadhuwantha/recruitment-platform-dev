import React from 'react';
import { cn } from '../../lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white' | 'neutral';
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  ...props
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  const variantMap = {
    primary: 'border-brand-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    neutral: 'border-text-muted border-t-transparent',
  };

  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizeMap[size],
        variantMap[variant],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
};

export default Spinner;
