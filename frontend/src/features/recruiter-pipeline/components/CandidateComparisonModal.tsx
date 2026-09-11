import React from 'react';
import { ScoreBadge } from '../../../components/ui/ScoreBadge';
import { Button } from '../../../components/ui/Button';
import {
  CandidateComparisonResponseDto,
  ApplicationStatus,
  KANBAN_STAGES,
} from '../types';
import {
  X,
  CheckCircle2,
  XCircle,
  Star,
  Briefcase,
  GraduationCap,
  Sparkles,
  BarChart2,
} from 'lucide-react';

interface CandidateComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CandidateComparisonResponseDto | null;
  isLoading?: boolean;
  onMoveStage?: (applicationId: string, stage: ApplicationStatus) => void;
  onInspectScore?: (applicationId: string, candidateName: string) => void;
}

export const CandidateComparisonModal: React.FC<CandidateComparisonModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading,
  onMoveStage,
  onInspectScore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-surface w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl border border-border-default flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-border-default flex items-center justify-between bg-surface-muted">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-text-primary">
                Candidate Comparison Matrix
              </h2>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Side-by-side evaluation for vacancy:{' '}
              <span className="font-semibold text-text-primary">{data?.jobTitle}</span>
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

        {/* Content Area */}
        <div className="p-6 overflow-y-auto overflow-x-auto flex-1 space-y-6">
          {isLoading && (
            <div className="py-16 text-center text-xs text-text-secondary">
              Generating side-by-side comparison matrix...
            </div>
          )}

          {!isLoading && data && (
            <div className="min-w-[700px]">
              {/* Candidate Headers Grid */}
              <div
                className="grid gap-4 border-b border-border-default pb-5"
                style={{
                  gridTemplateColumns: `180px repeat(${data.candidates.length}, minmax(200px, 1fr))`,
                }}
              >
                <div className="font-semibold text-xs text-text-secondary uppercase tracking-wider self-end pb-2">
                  Criteria
                </div>
                {data.candidates.map((c) => {
                  const stageObj = KANBAN_STAGES.find((s) => s.status === c.currentStage);
                  return (
                    <div
                      key={c.applicationId}
                      className="bg-surface-muted p-4 rounded-xl border border-border-default space-y-2 text-center relative"
                    >
                      <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold text-sm mx-auto flex items-center justify-center border border-brand-200">
                        {c.candidateName.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-bold text-xs text-text-primary line-clamp-1">
                        {c.candidateName}
                      </h3>
                      <p className="text-[11px] text-text-secondary line-clamp-1">
                        {c.headline || 'Applicant'}
                      </p>
                      <div className="pt-1">
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            stageObj ? stageObj.badgeColor : 'bg-surface border-border-default'
                          }`}
                        >
                          {stageObj?.label || c.currentStage}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Row 1: Overall ATS Score */}
              <div
                className="grid gap-4 py-4 border-b border-border-default/70 items-center"
                style={{
                  gridTemplateColumns: `180px repeat(${data.candidates.length}, minmax(200px, 1fr))`,
                }}
              >
                <div className="font-semibold text-xs text-text-primary">
                  Overall ATS Match
                </div>
                {data.candidates.map((c) => (
                  <div key={c.applicationId} className="flex flex-col items-center gap-1">
                    <ScoreBadge score={c.overallScore ?? 0} size="md" showLabel />
                    {c.manualOverrideScore !== null && c.manualOverrideScore !== undefined && (
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Manual Override ({c.manualOverrideScore}%)
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Row 2: Sub-scores Breakdown */}
              <div
                className="grid gap-4 py-4 border-b border-border-default/70 items-start"
                style={{
                  gridTemplateColumns: `180px repeat(${data.candidates.length}, minmax(200px, 1fr))`,
                }}
              >
                <div className="font-semibold text-xs text-text-primary">
                  Sub-Scores Breakdown
                </div>
                {data.candidates.map((c) => (
                  <div key={c.applicationId} className="space-y-1.5 text-xs text-text-secondary">
                    <div className="flex justify-between">
                      <span>Skills Match:</span>
                      <strong className="text-text-primary">
                        {c.subScores?.skillsScore ?? '—'}%
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Experience:</span>
                      <strong className="text-text-primary">
                        {c.subScores?.experienceScore ?? '—'}%
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Education:</span>
                      <strong className="text-text-primary">
                        {c.subScores?.educationScore ?? '—'}%
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Semantic TF-IDF:</span>
                      <strong className="text-text-primary">
                        {c.subScores?.semanticTfidfScore ?? '—'}%
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 3: Must-Have Skills Checklist */}
              <div
                className="grid gap-4 py-4 border-b border-border-default/70 items-start"
                style={{
                  gridTemplateColumns: `180px repeat(${data.candidates.length}, minmax(200px, 1fr))`,
                }}
              >
                <div>
                  <div className="font-semibold text-xs text-text-primary">
                    Must-Have Skills
                  </div>
                  <span className="text-[10px] text-text-muted">Direct Job Requirements</span>
                </div>
                {data.candidates.map((c) => {
                  const mustHaves = c.skills.filter((s) => s.priority === 'MUST_HAVE');
                  return (
                    <div key={c.applicationId} className="space-y-1.5 text-xs">
                      {mustHaves.map((skill) => (
                        <div
                          key={skill.name}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          {skill.isMatched ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                          <span
                            className={
                              skill.isMatched
                                ? 'text-text-primary font-medium'
                                : 'text-text-muted line-through'
                            }
                          >
                            {skill.name}
                          </span>
                        </div>
                      ))}
                      {mustHaves.length === 0 && (
                        <span className="text-text-muted text-xs">No must-have skills</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Row 4: Nice-To-Have Skills */}
              <div
                className="grid gap-4 py-4 border-b border-border-default/70 items-start"
                style={{
                  gridTemplateColumns: `180px repeat(${data.candidates.length}, minmax(200px, 1fr))`,
                }}
              >
                <div>
                  <div className="font-semibold text-xs text-text-primary">
                    Nice-to-Have Skills
                  </div>
                </div>
                {data.candidates.map((c) => {
                  const niceToHaves = c.skills.filter((s) => s.priority === 'NICE_TO_HAVE');
                  return (
                    <div key={c.applicationId} className="space-y-1 text-xs">
                      {niceToHaves.map((skill) => (
                        <div key={skill.name} className="flex items-center gap-1.5">
                          {skill.isMatched ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 text-center text-text-muted text-[10px]">
                              -
                            </span>
                          )}
                          <span className={skill.isMatched ? 'text-text-primary font-medium' : 'text-text-muted'}>
                            {skill.name}
                          </span>
                        </div>
                      ))}
                      {niceToHaves.length === 0 && (
                        <span className="text-text-muted text-xs">None</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Row 5: Experience */}
              <div
                className="grid gap-4 py-4 border-b border-border-default/70 items-center"
                style={{
                  gridTemplateColumns: `180px repeat(${data.candidates.length}, minmax(200px, 1fr))`,
                }}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-text-primary">
                  <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                  <span>Experience</span>
                </div>
                {data.candidates.map((c) => (
                  <div key={c.applicationId} className="text-xs text-center font-bold text-text-primary">
                    {c.yearsOfExperience ?? 0} Years Total
                  </div>
                ))}
              </div>

              {/* Row 6: Education */}
              <div
                className="grid gap-4 py-4 border-b border-border-default/70 items-center"
                style={{
                  gridTemplateColumns: `180px repeat(${data.candidates.length}, minmax(200px, 1fr))`,
                }}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-text-primary">
                  <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                  <span>Education</span>
                </div>
                {data.candidates.map((c) => (
                  <div key={c.applicationId} className="text-xs text-center text-text-secondary line-clamp-2">
                    {c.educationSummary || 'Not specified'}
                  </div>
                ))}
              </div>

              {/* Row 7: Team Star Rating */}
              <div
                className="grid gap-4 py-4 border-b border-border-default/70 items-center"
                style={{
                  gridTemplateColumns: `180px repeat(${data.candidates.length}, minmax(200px, 1fr))`,
                }}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-text-primary">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Team Rating</span>
                </div>
                {data.candidates.map((c) => (
                  <div key={c.applicationId} className="text-center text-xs">
                    {c.averageTeamRating ? (
                      <span className="font-bold text-amber-600">
                        ★ {c.averageTeamRating} / 5 ({c.notesCount} notes)
                      </span>
                    ) : (
                      <span className="text-text-muted">Unrated</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons Row */}
              <div
                className="grid gap-4 pt-5 items-center"
                style={{
                  gridTemplateColumns: `180px repeat(${data.candidates.length}, minmax(200px, 1fr))`,
                }}
              >
                <div className="font-semibold text-xs text-text-secondary">
                  Actions
                </div>
                {data.candidates.map((c) => (
                  <div key={c.applicationId} className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onInspectScore && onInspectScore(c.applicationId, c.candidateName)}
                      className="text-xs gap-1 justify-center"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-brand-600" />
                      <span>Inspect Score</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-muted border-t border-border-default flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Comparison
          </Button>
        </div>
      </div>
    </div>
  );
};
