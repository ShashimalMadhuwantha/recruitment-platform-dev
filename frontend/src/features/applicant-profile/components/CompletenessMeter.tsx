import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { ProfileCompletenessBreakdown } from '../types';

interface CompletenessMeterProps {
  completeness: ProfileCompletenessBreakdown;
  onOpenBlindPreview: () => void;
  onNavigateTab: (tab: string) => void;
}

export const CompletenessMeter: React.FC<CompletenessMeterProps> = ({
  completeness,
  onOpenBlindPreview,
  onNavigateTab,
}) => {
  const { score, personalInfo, workExperience, education, skills, resumeAttached, suggestions } = completeness;

  const getScoreBand = (val: number) => {
    if (val >= 80) return { color: 'bg-score-high text-score-high', bar: 'bg-emerald-600', label: 'Strong Profile' };
    if (val >= 50) return { color: 'bg-score-mid text-score-mid', bar: 'bg-amber-600', label: 'Moderate Profile' };
    return { color: 'bg-score-low text-score-low', bar: 'bg-rose-600', label: 'Incomplete Profile' };
  };

  const band = getScoreBand(score);

  const checklist = [
    { label: 'Basic Info & Summary', completed: personalInfo, weight: '20%', tab: 'basic' },
    { label: 'Work Experience', completed: workExperience, weight: '25%', tab: 'experience' },
    { label: 'Education History', completed: education, weight: '20%', tab: 'education' },
    { label: 'Core Skills (3+)', completed: skills, weight: '20%', tab: 'skills' },
    { label: 'Resume / CV Attached', completed: resumeAttached, weight: '15%', tab: 'resume' },
  ];

  return (
    <Card className="p-6 bg-surface border border-border-default space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-brand-900">Profile Completeness</h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${score >= 80 ? 'bg-emerald-50 text-emerald-700' : score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
              {band.label}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Complete profiles achieve up to 3.5x higher candidate match scores in recruiter searches.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenBlindPreview}
          className="flex items-center gap-2 border-brand-600 text-brand-600 hover:bg-brand-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Blind Recruitment Preview
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-text-primary">
          <span>Overall Readiness</span>
          <span className="text-base font-bold text-brand-900">{score}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${band.bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Checklist Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        {checklist.map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => onNavigateTab(item.tab)}
            className={`p-3 rounded-lg border text-left transition-all hover:border-brand-600 ${
              item.completed ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-surface-muted border-border-default text-text-secondary'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                {item.weight}
              </span>
              {item.completed ? (
                <span className="text-emerald-600 font-bold text-sm">✓</span>
              ) : (
                <span className="text-text-muted text-xs">○</span>
              )}
            </div>
            <p className="text-xs font-medium truncate">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Actionable Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 flex items-start gap-2.5">
          <span className="text-blue-600 text-base leading-none mt-0.5">💡</span>
          <div className="text-xs text-blue-900">
            <span className="font-semibold">Next step to improve your score: </span>
            {suggestions[0]}
          </div>
        </div>
      )}
    </Card>
  );
};
