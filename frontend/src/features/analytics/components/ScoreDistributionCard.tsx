import React from 'react';
import type { AtsScoreDistributionDto } from '@recruitment-platform/shared';

export interface ScoreDistributionCardProps {
  distribution: AtsScoreDistributionDto;
  isLoading?: boolean;
}

export const ScoreDistributionCard: React.FC<ScoreDistributionCardProps> = ({
  distribution,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-surface border border-border-default rounded-lg p-6 animate-pulse">
        <div className="h-5 w-48 bg-surface-muted rounded mb-4" />
        <div className="h-6 bg-surface-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-10 bg-surface-muted rounded" />
          <div className="h-10 bg-surface-muted rounded" />
          <div className="h-10 bg-surface-muted rounded" />
        </div>
      </div>
    );
  }

  const {
    strongMatchCount,
    strongMatchPercentage,
    partialMatchCount,
    partialMatchPercentage,
    weakMatchCount,
    weakMatchPercentage,
    totalScored,
    averageScore,
  } = distribution;

  return (
    <div className="bg-surface border border-border-default rounded-lg p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">ATS Score Distribution</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Candidate semantic match scores categorized by band
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-text-secondary">Average Score</span>
            <div className="text-lg font-bold text-text-primary">{averageScore}%</div>
          </div>
        </div>

        {totalScored === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">
            No scored applicants found for this scope.
          </div>
        ) : (
          <div>
            {/* Multi-segment stacked distribution bar */}
            <div className="w-full bg-surface-muted rounded-full h-3 overflow-hidden border border-border-default flex mb-4">
              {strongMatchPercentage > 0 && (
                <div
                  className="bg-score-high h-full"
                  style={{ width: `${strongMatchPercentage}%` }}
                  title={`Strong Match: ${strongMatchPercentage}%`}
                />
              )}
              {partialMatchPercentage > 0 && (
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${partialMatchPercentage}%` }}
                  title={`Partial Match: ${partialMatchPercentage}%`}
                />
              )}
              {weakMatchPercentage > 0 && (
                <div
                  className="bg-score-low h-full"
                  style={{ width: `${weakMatchPercentage}%` }}
                  title={`Weak Match: ${weakMatchPercentage}%`}
                />
              )}
            </div>

            {/* Score Band Breakdown Items */}
            <div className="space-y-2.5">
              {/* Strong Match */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border-default bg-surface hover:bg-surface-muted transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-score-high" />
                  <span className="text-xs font-semibold text-score-high bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Strong Match
                  </span>
                  <span className="text-xs text-text-muted">80% – 100%</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-text-primary">{strongMatchCount} candidates</span>
                  <span className="text-text-secondary w-10 text-right">{strongMatchPercentage}%</span>
                </div>
              </div>

              {/* Partial Match */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border-default bg-surface hover:bg-surface-muted transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Partial Match
                  </span>
                  <span className="text-xs text-text-muted">50% – 79%</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-text-primary">{partialMatchCount} candidates</span>
                  <span className="text-text-secondary w-10 text-right">{partialMatchPercentage}%</span>
                </div>
              </div>

              {/* Weak Match */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border-default bg-surface hover:bg-surface-muted transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-score-low" />
                  <span className="text-xs font-semibold text-score-low bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Weak Match
                  </span>
                  <span className="text-xs text-text-muted">&lt; 50%</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-text-primary">{weakMatchCount} candidates</span>
                  <span className="text-text-secondary w-10 text-right">{weakMatchPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border-default text-[11px] text-text-muted flex justify-between">
        <span>Total Candidates Scored: {totalScored}</span>
        <span>Weights configured in System Config</span>
      </div>
    </div>
  );
};
