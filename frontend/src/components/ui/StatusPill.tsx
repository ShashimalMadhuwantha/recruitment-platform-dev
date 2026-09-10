import React from 'react';
import { cn } from '../../lib/utils';
import { ApplicationStatus, JobStatus } from '@recruitment-platform/shared';

export interface StatusPillProps {
  status: ApplicationStatus | JobStatus | string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className }) => {
  const getStatusStyles = (val: string) => {
    switch (val) {
      case 'HIRED':
      case 'PUBLISHED':
      case 'ACTIVE':
        return 'bg-emerald-50 text-success border-emerald-200';
      case 'SCREENING':
      case 'SHORTLISTED':
      case 'INTERVIEW':
      case 'OFFER':
      case 'APPLIED':
        return 'bg-blue-50 text-brand-600 border-blue-200';
      case 'DRAFT':
      case 'PAUSED':
      case 'PENDING_APPROVAL':
        return 'bg-amber-50 text-warning border-amber-200';
      case 'REJECTED':
      case 'WITHDRAWN':
      case 'CLOSED':
      case 'FLAGGED':
      case 'BANNED':
      case 'SUSPENDED':
        return 'bg-red-50 text-danger border-red-200';
      default:
        return 'bg-surface-muted text-text-secondary border-border-default';
    }
  };

  const formatLabel = (val: string) => {
    return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        getStatusStyles(status),
        className
      )}
    >
      {formatLabel(status)}
    </span>
  );
};

export default StatusPill;
