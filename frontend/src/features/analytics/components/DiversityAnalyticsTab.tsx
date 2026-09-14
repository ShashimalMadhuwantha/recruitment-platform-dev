import React from 'react';
import type { DiversityAnalyticsDto } from '@recruitment-platform/shared';

export interface DiversityAnalyticsTabProps {
  data?: DiversityAnalyticsDto;
  isLoading?: boolean;
}

export const DiversityAnalyticsTab: React.FC<DiversityAnalyticsTabProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-surface-muted rounded-lg border border-border-default" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-surface-muted rounded-lg border border-border-default" />
          <div className="h-64 bg-surface-muted rounded-lg border border-border-default" />
        </div>
      </div>
    );
  }

  const isProtected = data?.isProtected ?? true;
  const totalRespondents = data?.totalRespondents ?? 0;

  return (
    <div className="space-y-6">
      {/* Privacy Trust Banner */}
      <div className="bg-surface border border-border-default rounded-lg p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200 text-role-recruiter flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-text-primary">
              Confidential & Voluntary Diversity Insights
            </h4>
            <span className="text-[11px] font-semibold text-role-recruiter bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              k-Anonymity Protected (k ≥ 5)
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-3xl leading-relaxed">
            Candidate survey answers are strictly confidential, decoupled from candidate evaluation cards,
            and never accessible on individual candidate profiles. Aggregate demographic reports are only
            rendered when at least 5 applicants participate to prevent de-anonymization.
          </p>
        </div>
      </div>

      {/* Protected Lock State if N < 5 */}
      {isProtected ? (
        <div className="bg-surface border border-border-default rounded-lg p-10 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-full bg-surface-muted border border-border-default text-text-muted flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h3 className="text-base font-semibold text-text-primary">
            Demographic Metrics Withheld for Candidate Privacy
          </h3>
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">
            {data?.protectionMessage ||
              'To ensure candidate identity cannot be inferred in small applicant pools, demographic breakdowns are withheld until at least 5 candidates have voluntarily submitted survey responses.'}
          </p>

          <div className="mt-6 max-w-xs mx-auto">
            <div className="flex justify-between text-xs font-medium text-text-secondary mb-1.5">
              <span>Survey Respondents</span>
              <span>
                <strong className="text-text-primary">{totalRespondents}</strong> / 5 required
              </span>
            </div>
            <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden border border-border-default">
              <div
                className="bg-role-recruiter h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalRespondents / 5) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-text-muted mt-2">
              {5 - totalRespondents > 0
                ? `${5 - totalRespondents} more response${5 - totalRespondents !== 1 ? 's' : ''} needed to unlock aggregated insights`
                : 'Sample size threshold met'}
            </p>
          </div>
        </div>
      ) : (
        /* Unlocked Demographic Insights Cards (N >= 5) */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">
              Total Voluntary Respondents:{' '}
              <strong className="text-text-primary font-semibold">{totalRespondents}</strong>
            </span>
            <span className="text-xs text-text-muted">
              Updated automatically on survey submissions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender Representation */}
            <div className="bg-surface border border-border-default rounded-lg p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">
                  Gender Identity Distribution
                </h4>
                <p className="text-xs text-text-secondary mb-4">
                  Self-reported gender breakdown of voluntary applicants
                </p>

                <div className="space-y-3">
                  {data?.genderBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-text-primary">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted">{item.count}</span>
                          <span className="font-semibold text-text-primary w-10 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden border border-border-default">
                        <div
                          className="bg-brand-600 h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Race & Ethnicity Breakdown */}
            <div className="bg-surface border border-border-default rounded-lg p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">
                  Race & Ethnicity Representation
                </h4>
                <p className="text-xs text-text-secondary mb-4">
                  Aggregated ethnic background distribution
                </p>

                <div className="space-y-3">
                  {data?.raceBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-text-primary">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted">{item.count}</span>
                          <span className="font-semibold text-text-primary w-10 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden border border-border-default">
                        <div
                          className="bg-role-recruiter h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Veteran Status */}
            <div className="bg-surface border border-border-default rounded-lg p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">
                  Veteran Status
                </h4>
                <p className="text-xs text-text-secondary mb-4">
                  Military service affiliation of applicants
                </p>

                <div className="space-y-3">
                  {data?.veteranBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-text-primary">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted">{item.count}</span>
                          <span className="font-semibold text-text-primary w-10 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden border border-border-default">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Disability Status */}
            <div className="bg-surface border border-border-default rounded-lg p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">
                  Disability Status
                </h4>
                <p className="text-xs text-text-secondary mb-4">
                  Voluntary self-identification of disabilities
                </p>

                <div className="space-y-3">
                  {data?.disabilityBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-text-primary">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted">{item.count}</span>
                          <span className="font-semibold text-text-primary w-10 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden border border-border-default">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
