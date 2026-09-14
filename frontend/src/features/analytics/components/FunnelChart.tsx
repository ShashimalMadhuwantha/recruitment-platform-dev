import React from 'react';
import type { FunnelStageMetricDto } from '@recruitment-platform/shared';

export interface FunnelChartProps {
  stages: FunnelStageMetricDto[];
  totalApplications: number;
  totalHired: number;
  overallConversionRate: number;
  isLoading?: boolean;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  stages,
  totalApplications,
  totalHired,
  overallConversionRate,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-surface border border-border-default rounded-lg p-6 animate-pulse">
        <div className="h-6 w-48 bg-surface-muted rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-surface-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stages || stages.length === 0 || totalApplications === 0) {
    return (
      <div className="bg-surface border border-border-default rounded-lg p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mx-auto mb-3 text-text-muted">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-text-primary">No funnel data available</h4>
        <p className="text-xs text-text-secondary mt-1">
          Candidate progressions will populate the recruitment funnel as applicants move through stages.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-default rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Recruitment Pipeline Funnel</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Stage-by-stage candidate progression and drop-off analysis
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-text-secondary">
            Overall Conversion:{' '}
            <strong className="text-role-recruiter font-semibold">{overallConversionRate}%</strong>
          </span>
          <span className="text-text-secondary">
            Total Hired: <strong className="text-text-primary font-semibold">{totalHired}</strong>
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stg, idx) => {
          // Scale bar width relative to max stage or total
          const barWidth = `${Math.max(4, stg.percentageOfTotal)}%`;

          return (
            <div key={stg.stage} className="relative">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-surface-muted text-text-secondary flex items-center justify-center text-[10px] font-semibold border border-border-default">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-text-primary">{stg.label}</span>
                  {idx > 0 && (
                    <span className="text-[11px] text-text-secondary bg-surface-muted px-1.5 py-0.5 rounded border border-border-default">
                      {stg.conversionFromPrev}% of prev stage
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-text-primary">{stg.count} candidates</span>
                  <span className="text-text-secondary w-12 text-right">
                    {stg.percentageOfTotal}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface-muted rounded-full h-3.5 overflow-hidden border border-border-default flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stg.stage === 'HIRED'
                      ? 'bg-score-high'
                      : stg.stage === 'OFFER'
                      ? 'bg-role-recruiter'
                      : 'bg-brand-600'
                  }`}
                  style={{ width: barWidth }}
                />
              </div>

              {/* Drop-off Indicator between stages */}
              {idx < stages.length - 1 && stg.dropOffCount > 0 && (
                <div className="pl-6 py-1 flex items-center gap-2 text-[11px] text-text-muted">
                  <span className="inline-block w-2.5 h-2.5 border-l-2 border-b-2 border-border-default -mt-1 ml-0.5" />
                  <span>
                    Drop-off: <strong className="text-score-low font-normal">{stages[idx + 1].dropOffPercentage}%</strong> ({stages[idx + 1].dropOffCount} candidate{stages[idx + 1].dropOffCount !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
