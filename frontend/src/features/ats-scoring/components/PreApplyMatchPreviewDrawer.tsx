import React from 'react';
import { usePreApplyMatchPreview } from '../hooks';
import { ScoreBadge } from '../../../components/ui/ScoreBadge';
import { Button } from '../../../components/ui/Button';

export interface PreApplyMatchPreviewDrawerProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onProceedToApply?: () => void;
}

export const PreApplyMatchPreviewDrawer: React.FC<PreApplyMatchPreviewDrawerProps> = ({
  jobId,
  isOpen,
  onClose,
  onProceedToApply,
}) => {
  const { data: preview, isLoading, error } = usePreApplyMatchPreview(jobId, isOpen);

  if (!isOpen) return null;

  const breakdown = preview?.breakdown;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-brand-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-lg bg-surface h-full shadow-xl flex flex-col border-l border-border-default animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-surface-muted/50">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Match Preview</h2>
            <p className="text-xs text-text-secondary">
              {preview?.jobTitle || 'Job Role Analysis'} • {preview?.companyName || 'Company'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface transition-colors"
            aria-label="Close match preview"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-text-secondary">Computing ATS match against your profile...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              Failed to load match preview. Please verify your profile is complete and try again.
            </div>
          )}

          {preview && breakdown && (
            <>
              {/* Overall Score Banner */}
              <div className="flex items-center justify-between p-5 rounded-lg border border-border-default bg-surface-muted/30">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Predicted Match
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-text-primary">
                      {preview.overallScore}%
                    </span>
                    <span className="text-xs text-text-secondary">match strength</span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Based on your profile skills, experience, and CV.
                  </p>
                </div>
                <ScoreBadge score={preview.overallScore} size="lg" />
              </div>

              {/* Recommendations Box */}
              {preview.recommendations && preview.recommendations.length > 0 && (
                <div className="p-4 rounded-lg border border-brand-600/20 bg-brand-100/30 space-y-2">
                  <h4 className="text-xs font-semibold text-brand-900 flex items-center gap-1.5">
                    💡 Match Improvement Suggestions
                  </h4>
                  <ul className="space-y-1.5 text-xs text-text-primary">
                    {preview.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-brand-600 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Skills Warning */}
              {preview.missingCriticalSkills && preview.missingCriticalSkills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-text-primary">
                    Missing Must-Have Skills ({preview.missingCriticalSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.missingCriticalSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-danger/10 border border-danger/20 text-danger rounded-md text-xs font-medium"
                      >
                        ⚠️ {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-text-secondary">
                    Add these skills to your profile if you have practical experience with them.
                  </p>
                </div>
              )}

              {/* Matched Skills */}
              {breakdown.skillsMatch.matchedItems && breakdown.skillsMatch.matchedItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-text-primary">
                    Matched Skills ({breakdown.skillsMatch.matchedItems.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {breakdown.skillsMatch.matchedItems.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-success/10 border border-success/20 text-success rounded-md text-xs font-medium"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Score Meters */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Dimension Breakdown
                </h4>

                <div className="space-y-3 text-xs">
                  {/* Skills */}
                  <div>
                    <div className="flex justify-between font-medium mb-1 text-text-primary">
                      <span>Skills Match ({breakdown.skillsMatch.weight}%)</span>
                      <span className="font-semibold">{breakdown.skillsMatch.score}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full"
                        style={{ width: `${breakdown.skillsMatch.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <div className="flex justify-between font-medium mb-1 text-text-primary">
                      <span>Experience Alignment ({breakdown.experienceMatch.weight}%)</span>
                      <span className="font-semibold">{breakdown.experienceMatch.score}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full"
                        style={{ width: `${breakdown.experienceMatch.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <div className="flex justify-between font-medium mb-1 text-text-primary">
                      <span>Education Requirement ({breakdown.educationMatch.weight}%)</span>
                      <span className="font-semibold">{breakdown.educationMatch.score}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full"
                        style={{ width: `${breakdown.educationMatch.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Semantic */}
                  <div>
                    <div className="flex justify-between font-medium mb-1 text-text-primary">
                      <span>CV Semantic Alignment ({breakdown.semanticMatch.weight}%)</span>
                      <span className="font-semibold">{breakdown.semanticMatch.score}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full"
                        style={{ width: `${breakdown.semanticMatch.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <div className="flex justify-between font-medium mb-1 text-text-primary">
                      <span>Certifications ({breakdown.certificationMatch.weight}%)</span>
                      <span className="font-semibold">{breakdown.certificationMatch.score}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full"
                        style={{ width: `${breakdown.certificationMatch.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Matching Terms */}
              {breakdown.topMatchingTerms && breakdown.topMatchingTerms.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border-default">
                  <h4 className="text-xs font-semibold text-text-primary">Top Shared Keywords</h4>
                  <div className="flex flex-wrap gap-1">
                    {breakdown.topMatchingTerms.map((term) => (
                      <span
                        key={term}
                        className="px-2 py-0.5 bg-surface-muted text-text-secondary rounded text-[11px]"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border-default bg-surface flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
          {onProceedToApply && (
            <Button variant="primary" onClick={onProceedToApply} className="w-full">
              Proceed to Apply
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreApplyMatchPreviewDrawer;
