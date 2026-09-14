import React, { useState } from 'react';
import {
  X,
  Star,
  Award,
  ThumbsUp,
  ThumbsDown,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useSubmitInterviewFeedback } from '../hooks';
import type {
  InterviewScheduleDto,
  RecommendationType,
  ScorecardRatingCriteria,
} from '../types';

interface InterviewScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: InterviewScheduleDto | null;
  applicationId: string;
}

type CriteriaKeys = keyof Omit<ScorecardRatingCriteria, 'overallAverage'>;

const CRITERIA_DEFINITIONS: Array<{
  key: CriteriaKeys;
  label: string;
  description: string;
}> = [
  {
    key: 'technicalCompetency',
    label: 'Technical Competency & Engineering Depth',
    description: 'Mastery of tools, clean architecture, performance and design patterns.',
  },
  {
    key: 'communication',
    label: 'Communication & Articulation',
    description: 'Clarity of explanations, active listening, and structured thought delivery.',
  },
  {
    key: 'problemSolving',
    label: 'Problem Solving & Critical Thinking',
    description: 'Approach to ambiguity, edge cases, trade-offs, and logical debugging.',
  },
  {
    key: 'experienceAlignment',
    label: 'Domain Experience & Role Fit',
    description: 'Demonstrated past accomplishments aligned with specific vacancy needs.',
  },
  {
    key: 'culturalFit',
    label: 'Values & Team Collaboration',
    description: 'Growth mindset, ownership, humility, and positive team dynamics.',
  },
];

const RECOMMENDATION_OPTIONS: Array<{
  value: RecommendationType;
  label: string;
  badgeClass: string;
  desc: string;
}> = [
  {
    value: 'STRONG_HIRE',
    label: 'Strong Hire',
    badgeClass: 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-emerald-500',
    desc: 'Exceptional candidate who raises the team bar significantly.',
  },
  {
    value: 'HIRE',
    label: 'Hire',
    badgeClass: 'border-blue-500 bg-blue-50 text-blue-800 ring-blue-500',
    desc: 'Solid candidate who meets all critical requirements for this role.',
  },
  {
    value: 'NEUTRAL',
    label: 'Neutral',
    badgeClass: 'border-slate-400 bg-slate-50 text-slate-800 ring-slate-400',
    desc: 'Mixed indicators; could succeed with support or warrants additional input.',
  },
  {
    value: 'DO_NOT_HIRE',
    label: 'Do Not Hire',
    badgeClass: 'border-amber-500 bg-amber-50 text-amber-800 ring-amber-500',
    desc: 'Has gaps in key competencies needed for immediate success.',
  },
  {
    value: 'STRONG_DO_NOT_HIRE',
    label: 'Strong Do Not Hire',
    badgeClass: 'border-rose-500 bg-rose-50 text-rose-800 ring-rose-500',
    desc: 'Clear mismatch with core requirements or company culture.',
  },
];

export const InterviewScorecardModal: React.FC<InterviewScorecardModalProps> = ({
  isOpen,
  onClose,
  interview,
  applicationId,
}) => {
  const [ratings, setRatings] = useState<Record<CriteriaKeys, number>>({
    technicalCompetency: 4,
    communication: 4,
    problemSolving: 4,
    experienceAlignment: 4,
    culturalFit: 4,
  });

  const [recommendation, setRecommendation] = useState<RecommendationType>('HIRE');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submitFeedbackMutation = useSubmitInterviewFeedback(applicationId);

  if (!isOpen || !interview) return null;

  // Calculate live average
  const ratingValues = Object.values(ratings);
  const averageScore =
    ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length;

  const handleRatingChange = (key: CriteriaKeys, val: number) => {
    setRatings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await submitFeedbackMutation.mutateAsync({
        interviewId: interview.id,
        dto: {
          scorecard: {
            ...ratings,
            overallAverage: Number(averageScore.toFixed(1)),
          },
          recommendation,
          notes: notes.trim() || undefined,
        },
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit scorecard. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-border-default overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-border-default bg-surface-muted flex items-start justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-600" />
              <span>Interview Scorecard & Evaluation</span>
            </h2>
            <p className="text-xs text-text-secondary">
              Evaluating <strong className="text-text-primary">{interview.candidateName}</strong> for{' '}
              <span className="font-semibold text-text-primary">{interview.jobTitle}</span> ({interview.title})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Average Score Banner */}
          <div className="bg-brand-50 border border-brand-200 p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-brand-900">Overall Scorecard Average</span>
              <p className="text-[11px] text-brand-700">Calculated dynamically across the 5 core competency areas</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-brand-700">{averageScore.toFixed(1)}</span>
              <span className="text-xs text-brand-600 font-medium"> / 5.0</span>
            </div>
          </div>

          {/* 5 Rating Criteria */}
          <div className="space-y-4">
            <h3 className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
              Core Competencies (1 to 5 Stars)
            </h3>

            <div className="space-y-3">
              {CRITERIA_DEFINITIONS.map((crit) => {
                const currentVal = ratings[crit.key];

                return (
                  <div
                    key={crit.key}
                    className="p-3.5 rounded-xl border border-border-default bg-surface hover:border-text-muted transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 flex-1">
                      <p className="font-bold text-xs text-text-primary">{crit.label}</p>
                      <p className="text-[11px] text-text-secondary">{crit.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(crit.key, star)}
                          className="p-1 rounded-md hover:scale-115 transition-transform"
                          aria-label={`Rate ${crit.label} ${star} of 5`}
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= currentVal
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-text-muted hover:text-amber-400'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="w-5 text-right font-bold text-xs text-text-primary ml-1">
                        {currentVal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendation Options */}
          <div className="space-y-3">
            <h3 className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
              Final Recommendation *
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {RECOMMENDATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecommendation(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    recommendation === opt.value
                      ? `${opt.badgeClass} ring-2 shadow-2xs font-semibold`
                      : 'border-border-default bg-surface text-text-secondary hover:border-text-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {recommendation === opt.value && (
                      <span className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </div>
                  <p className="text-[10px] mt-1 opacity-80 leading-normal">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Qualitative Feedback Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-text-primary flex items-center justify-between">
              <span>Interviewer Notes & Synthesis (Confidential to Hiring Team)</span>
              <span className="text-[10px] text-text-muted">Not visible to candidate</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail candidate highlights, potential risks, architecture knowledge, or specific team trade-offs..."
              rows={4}
              className="w-full p-2.5 bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-text-primary placeholder:text-text-muted"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border-default">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitFeedbackMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitFeedbackMutation.isPending}
              className="gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Scorecard & Complete Interview'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
