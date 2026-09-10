import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  dense?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, dense = false, className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-surface border border-border-default rounded-lg transition-shadow',
        dense ? 'p-4' : 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
