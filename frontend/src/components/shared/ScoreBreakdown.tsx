import React from 'react';
import { AtsScoreBreakdown } from '@recruitment-platform/shared';
import { Card } from '../ui/Card';
import { ScoreBadge } from '../ui/ScoreBadge';

export interface ScoreBreakdownProps {
  breakdown: AtsScoreBreakdown;
  className?: string;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ breakdown, className }) => {
  const subScores = [
    { label: 'Skills Match', item: breakdown.skillsMatch, description: 'Matched vs required skills' },
    { label: 'Experience Match', item: breakdown.experienceMatch, description: 'Years & relevance' },
    { label: 'Education Match', item: breakdown.educationMatch, description: 'Degree requirement' },
    { label: 'Semantic Similarity', item: breakdown.semanticMatch, description: 'TF-IDF text alignment' },
    { label: 'Certifications', item: breakdown.certificationMatch, description: 'Required credentials' },
  ];

  return (
    <Card className={className}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border-default">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">ATS Score Breakdown</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Deterministic weighted evaluation based on job criteria
          </p>
        </div>
        <ScoreBadge score={breakdown.overallScore} size="lg" />
      </div>

      <div className="mt-6 space-y-4">
        {subScores.map(({ label, item, description }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-text-primary">
                {label} <span className="text-text-muted">({item.weight}% weight)</span>
              </span>
              <span className="font-semibold text-text-primary">{item.score}%</span>
            </div>
            <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden border border-border-default/50">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-500"
                style={{ width: `${item.score}%` }}
              />
            </div>
            <p className="text-[11px] text-text-secondary">{description}</p>
          </div>
        ))}
      </div>

      {breakdown.topMatchingTerms && breakdown.topMatchingTerms.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border-default">
          <h4 className="text-xs font-semibold text-text-primary mb-2">Top Matching Terms</h4>
          <div className="flex flex-wrap gap-1.5">
            {breakdown.topMatchingTerms.map((term) => (
              <span
                key={term}
                className="px-2 py-0.5 bg-brand-100/60 text-brand-900 rounded-full text-xs font-medium"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ScoreBreakdown;
