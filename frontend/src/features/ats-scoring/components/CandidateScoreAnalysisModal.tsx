import React, { useState } from 'react';
import { useApplicationAtsScore, useOverrideAtsScore } from '../hooks';
import { ScoreBadge } from '../../../components/ui/ScoreBadge';
import { Button } from '../../../components/ui/Button';

export interface CandidateScoreAnalysisModalProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  jobTitle?: string;
}

export const CandidateScoreAnalysisModal: React.FC<CandidateScoreAnalysisModalProps> = ({
  applicationId,
  isOpen,
  onClose,
  candidateName,
  jobTitle,
}) => {
  const { data: scoreDetail, isLoading, error } = useApplicationAtsScore(applicationId, isOpen);
  const overrideMutation = useOverrideAtsScore();

  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideScore, setOverrideScore] = useState<number>(85);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  if (!isOpen) return null;

  const breakdown = scoreDetail?.breakdown;
  const effectiveScore = scoreDetail?.manualOverrideScore ?? scoreDetail?.overallScore ?? 0;

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideError(null);

    if (overrideScore < 0 || overrideScore > 100) {
      setOverrideError('Score must be between 0 and 100');
      return;
    }

    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      setOverrideError('Please provide a meaningful justification reason (at least 5 characters).');
      return;
    }

    try {
      await overrideMutation.mutateAsync({
        applicationId,
        data: {
          overrideScore: Number(overrideScore),
          reason: overrideReason.trim(),
        },
      });
      setShowOverrideForm(false);
      setOverrideReason('');
    } catch (err: any) {
      setOverrideError(err.response?.data?.error?.message || 'Failed to save score adjustment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-xl border border-border-default shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-surface-muted/50">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Candidate ATS Score Analysis</h3>
            <p className="text-xs text-text-secondary">
              {candidateName || scoreDetail?.applicant?.firstName
                ? `${scoreDetail?.applicant?.firstName} ${scoreDetail?.applicant?.lastName}`
                : 'Applicant'}{' '}
              • {jobTitle || scoreDetail?.job?.title || 'Job Position'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-text-secondary">Loading deterministic ATS score analysis...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              Failed to load ATS score analysis. Please try again.
            </div>
          )}

          {scoreDetail && breakdown && (
            <>
              {/* Manual Override Indicator Banner if active */}
              {scoreDetail.manualOverrideScore !== null && scoreDetail.manualOverrideScore !== undefined && (
                <div className="p-3.5 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span>⚡ Score Manually Adjusted by Recruiter</span>
                    <span>Override Score: {scoreDetail.manualOverrideScore}%</span>
                  </div>
                  <p className="text-text-primary">
                    <span className="font-medium text-text-secondary">Justification:</span>{' '}
                    {scoreDetail.overrideReason || 'Direct recruiter calibration'}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    Original Algorithmic Score: {scoreDetail.overallScore}% • Recorded in compliance audit log
                  </p>
                </div>
              )}

              {/* Overall Score Header */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border-default bg-surface-muted/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-text-primary">{effectiveScore}%</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-900">
                      {scoreDetail.scoreBand} Band
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {scoreDetail.manualOverrideScore !== null && scoreDetail.manualOverrideScore !== undefined
                      ? 'Effective score includes recruiter manual calibration'
                      : 'Deterministic weighted aggregate across all 5 evaluation dimensions'}
                  </p>
                </div>
                <ScoreBadge score={effectiveScore} size="lg" />
              </div>

              {/* 5 Sub-Scores Analysis */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Dimension Breakdown & Evidence
                </h4>

                {/* 1. Skills Match */}
                <div className="p-3.5 rounded-lg border border-border-default bg-surface space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">
                      1. Skills Match ({breakdown.skillsMatch.weight}% weight)
                    </span>
                    <span className="font-bold text-brand-900">{breakdown.skillsMatch.score}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${breakdown.skillsMatch.score}%` }}
                    />
                  </div>
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {breakdown.skillsMatch.matchedItems?.map((item) => (
                      <span
                        key={item}
                        className="px-2 py-0.5 rounded text-[11px] bg-success/10 text-success font-medium border border-success/20"
                      >
                        ✓ {item}
                      </span>
                    ))}
                    {breakdown.skillsMatch.missingItems?.map((item) => (
                      <span
                        key={item}
                        className="px-2 py-0.5 rounded text-[11px] bg-danger/10 text-danger font-medium border border-danger/20"
                      >
                        ✕ {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Experience Match */}
                <div className="p-3.5 rounded-lg border border-border-default bg-surface space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">
                      2. Experience Duration & Role Relevance ({breakdown.experienceMatch.weight}% weight)
                    </span>
                    <span className="font-bold text-brand-900">{breakdown.experienceMatch.score}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${breakdown.experienceMatch.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary">
                    Applicant: {String(breakdown.experienceMatch.details?.applicantExperienceYears ?? 0)} yrs • Required:{' '}
                    {String(breakdown.experienceMatch.details?.requiredExperienceYears ?? 0)} yrs
                  </p>
                </div>

                {/* 3. Education Match */}
                <div className="p-3.5 rounded-lg border border-border-default bg-surface space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">
                      3. Education Qualification ({breakdown.educationMatch.weight}% weight)
                    </span>
                    <span className="font-bold text-brand-900">{breakdown.educationMatch.score}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${breakdown.educationMatch.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary">
                    Applicant: {String(breakdown.educationMatch.details?.applicantEducationLevel ?? 'None')} • Required:{' '}
                    {String(breakdown.educationMatch.details?.requiredEducationLevel ?? 'Not specified')}
                  </p>
                </div>

                {/* 4. Semantic Text Similarity */}
                <div className="p-3.5 rounded-lg border border-border-default bg-surface space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">
                      4. TF-IDF Semantic Keyword Similarity ({breakdown.semanticMatch.weight}% weight)
                    </span>
                    <span className="font-bold text-brand-900">{breakdown.semanticMatch.score}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${breakdown.semanticMatch.score}%` }}
                    />
                  </div>
                  {breakdown.topMatchingTerms && breakdown.topMatchingTerms.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {breakdown.topMatchingTerms.map((term) => (
                        <span
                          key={term}
                          className="px-2 py-0.5 rounded text-[11px] bg-brand-100/60 text-brand-900 font-medium"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Certifications */}
                <div className="p-3.5 rounded-lg border border-border-default bg-surface space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">
                      5. Certifications Match ({breakdown.certificationMatch.weight}% weight)
                    </span>
                    <span className="font-bold text-brand-900">{breakdown.certificationMatch.score}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${breakdown.certificationMatch.score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Manual Score Override Toggle / Form (FR-ATS-06, FR-ATS-10) */}
              <div className="pt-4 border-t border-border-default space-y-3">
                {!showOverrideForm ? (
                  <Button
                    variant="secondary"
                    onClick={() => setShowOverrideForm(true)}
                    className="w-full text-xs"
                  >
                    ✏️ Calibrate / Override ATS Score
                  </Button>
                ) : (
                  <form
                    onSubmit={handleSaveOverride}
                    className="p-4 rounded-lg border border-brand-600/30 bg-surface-muted/40 space-y-3 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-text-primary">
                        Manual Score Calibration (Audit Logged)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowOverrideForm(false)}
                        className="text-xs text-text-muted hover:text-text-primary"
                      >
                        Cancel
                      </button>
                    </div>

                    {overrideError && (
                      <p className="text-xs text-danger font-medium">{overrideError}</p>
                    )}

                    <div className="space-y-1">
                      <label htmlFor="override-score-input" className="text-xs font-medium text-text-primary">
                        Adjusted Score (0 to 100)
                      </label>
                      <input
                        id="override-score-input"
                        type="number"
                        min="0"
                        max="100"
                        value={overrideScore}
                        onChange={(e) => setOverrideScore(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-surface border border-border-default rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand-600"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="override-reason-input" className="text-xs font-medium text-text-primary">
                        Mandatory Justification Reason (Required for Compliance)
                      </label>
                      <textarea
                        id="override-reason-input"
                        rows={2}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="e.g. Demonstrated exceptional architecture knowledge during live technical screen."
                        className="w-full px-3 py-1.5 text-xs bg-surface border border-border-default rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand-600"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowOverrideForm(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={overrideMutation.isPending}
                        className="text-xs"
                      >
                        {overrideMutation.isPending ? 'Saving...' : 'Save Calibration'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-default bg-surface flex justify-end">
          <Button variant="secondary" onClick={onClose} className="px-6 text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CandidateScoreAnalysisModal;
