import React from 'react';
import type { SourceAttributionDto } from '@recruitment-platform/shared';

export interface SourceAttributionCardProps {
  sources: SourceAttributionDto[];
  total: number;
  isLoading?: boolean;
}

export const SourceAttributionCard: React.FC<SourceAttributionCardProps> = ({
  sources,
  total,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-surface border border-border-default rounded-lg p-6 animate-pulse">
        <div className="h-5 w-40 bg-surface-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-surface-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-default rounded-lg p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Candidate Acquisition</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Applications attributed by sourcing channel
            </p>
          </div>
          <span className="text-xs font-semibold text-text-secondary bg-surface-muted px-2 py-0.5 rounded border border-border-default">
            {total} Total
          </span>
        </div>

        {sources.length === 0 || total === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">
            No source attribution records found.
          </div>
        ) : (
          <div className="space-y-3.5 mt-2">
            {sources.map((src) => (
              <div key={src.source}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-text-primary">{src.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">{src.count} applicants</span>
                    <span className="font-semibold text-text-primary w-10 text-right">
                      {src.percentage}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden border border-border-default">
                  <div
                    className="bg-role-recruiter h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(2, src.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border-default text-[11px] text-text-muted flex justify-between">
        <span>Channel performance</span>
        <span>Includes direct, social & referrals</span>
      </div>
    </div>
  );
};
