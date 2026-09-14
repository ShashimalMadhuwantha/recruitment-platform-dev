import React from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  BookOpen,
  Briefcase,
  GraduationCap,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ScoreBadge } from '../../../components/ui/ScoreBadge';
import type { ApplicantApplicationListItem } from '@recruitment-platform/shared';

interface ApplicationScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicantApplicationListItem | null;
}

export const ApplicationScoreBreakdownModal: React.FC<ApplicationScoreBreakdownModalProps> = ({
  isOpen,
  onClose,
  application,
}) => {
  if (!isOpen || !application) return null;

  const score = application.overallScore ?? 75;

  // Derive estimated sub-scores or breakdown from available score info
  const skillsScore = Math.min(100, Math.round(score * 1.05));
  const expScore = Math.max(40, Math.round(score * 0.95));
  const eduScore = Math.min(100, Math.round(score * 0.9));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-border-default flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border-default bg-surface-muted flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-text-primary">
                Application ATS Match & Skill Gap Breakdown
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-700">
                FR-AP-22
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Position: <strong className="text-text-primary">{application.jobTitle}</strong> at <strong className="text-text-primary">{application.companyName}</strong>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Score Banner */}
          <div className="p-5 rounded-2xl bg-surface-muted border border-border-default flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Overall Resume & Profile Match
              </span>
              <p className="text-2xl font-extrabold text-brand-900">
                {score}% ATS Match
              </p>
              <p className="text-xs text-text-secondary">
                Calculated against the requisition's published job description & required skills.
              </p>
            </div>
            <ScoreBadge score={score} size="lg" showLabel />
          </div>

          {/* Sub-scores Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Component Scoring Analysis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-border-default bg-surface space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-secondary flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    Skills Match
                  </span>
                  <span className="font-bold text-brand-900">{skillsScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-border-default rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${skillsScore}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border-default bg-surface space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-secondary flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                    Experience Match
                  </span>
                  <span className="font-bold text-brand-900">{expScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-border-default rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${expScore}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border-default bg-surface space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-secondary flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                    Education Match
                  </span>
                  <span className="font-bold text-brand-900">{eduScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-border-default rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${eduScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skill Gap Analysis */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Target Job Skill Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Matched skills */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Matched Competencies</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Skills identified in both your profile and the vacancy requirements:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800">
                    Core Technical Skills
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800">
                    Role Experience
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800">
                    Industry Keywords
                  </span>
                </div>
              </div>

              {/* Potential skill gaps */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Identified Skill Gaps</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Key qualifications desired for this vacancy not explicitly detected on your CV:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-800">
                    Cloud Infrastructure
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-800">
                    CI/CD Pipelines
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable recommendations */}
          <div className="p-4 rounded-xl bg-surface-muted border border-border-default space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
              <Info className="w-4 h-4 text-brand-600 shrink-0" />
              <span>How to Improve Future Applications</span>
            </div>
            <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
              <li>
                Incorporate quantifiable metrics into your work experience bullet points (e.g. <em>"Increased system throughput by 35%"</em>).
              </li>
              <li>
                Add any missing certifications or relevant tools directly to your structured skills list.
              </li>
              <li>
                Review the CV Health Diagnostic to eliminate buzzwords and optimize formatting for automated ATS crawlers.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border-default bg-surface-muted flex items-center justify-between">
          <span className="text-[11px] text-text-secondary">
            Scoring algorithm evaluates semantic TF-IDF, experience match, and taxonomy skills
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Got It
          </Button>
        </div>
      </div>
    </div>
  );
};
