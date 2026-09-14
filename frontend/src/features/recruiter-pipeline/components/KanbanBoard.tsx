import React from 'react';
import { ScoreBadge } from '../../../components/ui/ScoreBadge';
import { Card } from '../../../components/ui/Card';
import {
  PipelineCandidateDto,
  KANBAN_STAGES,
  ApplicationStatus,
} from '../types';
import {
  Star,
  MessageSquare,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface KanbanBoardProps {
  candidates: PipelineCandidateDto[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectCandidate: (candidate: PipelineCandidateDto) => void;
  onOpenScoreAnalysis: (candidate: PipelineCandidateDto) => void;
  onMoveStage: (candidateId: string, targetStage: ApplicationStatus) => void;
  isMovingStage?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  candidates,
  selectedIds,
  onToggleSelect,
  onSelectCandidate,
  onOpenScoreAnalysis,
  onMoveStage,
  isMovingStage,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 items-start overflow-x-auto pb-4">
      {KANBAN_STAGES.map((stage) => {
        const stageCandidates = candidates.filter((c) => c.status === stage.status);

        return (
          <div
            key={stage.status}
            className="bg-surface-muted rounded-xl border border-border-default flex flex-col min-w-[260px] max-h-[800px] shadow-2xs"
          >
            {/* Column Header */}
            <div
              className={`p-3 border-b border-border-default rounded-t-xl flex items-center justify-between ${stage.headerBg}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full border ${stage.accentColor} bg-current`}
                />
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  {stage.label}
                </span>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${stage.badgeColor}`}
              >
                {stageCandidates.length}
              </span>
            </div>

            {/* Candidates List Container */}
            <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 max-h-[720px]">
              {stageCandidates.map((candidate) => {
                const isSelected = selectedIds.includes(candidate.id);
                const effectiveScore = candidate.atsScore?.overallScore ?? 0;
                const hasNotes = candidate.notesCount > 0;

                return (
                  <Card
                    key={candidate.id}
                    dense
                    className={`relative border transition-all duration-150 p-3 bg-surface hover:shadow-sm ${
                      isSelected
                        ? 'border-brand-600 ring-2 ring-brand-600/20 bg-brand-50/20'
                        : 'border-border-default hover:border-brand-600/40'
                    }`}
                  >
                    {/* Top Row: Checkbox, Name, ATS Score */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(candidate.id)}
                          aria-label={`Select candidate ${candidate.fullName}`}
                          className="mt-0.5 w-3.5 h-3.5 rounded border-border-default text-brand-600 focus:ring-brand-600 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onSelectCandidate(candidate)}
                            className="text-xs font-bold text-text-primary hover:text-brand-600 text-left line-clamp-1 truncate"
                            title={candidate.fullName}
                          >
                            {candidate.fullName}
                          </button>
                          <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                            {candidate.headline || 'Applicant'}
                          </p>
                          {candidate.jobOffer && (
                            <span
                              className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                candidate.jobOffer.status === 'ACCEPTED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : candidate.jobOffer.status === 'SENT'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : candidate.jobOffer.status === 'DECLINED'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-300'
                              }`}
                            >
                              Offer: {candidate.jobOffer.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score Badge */}
                      <button
                        type="button"
                        onClick={() => onOpenScoreAnalysis(candidate)}
                        title="Click to inspect ATS score breakdown and override"
                        className="shrink-0 hover:scale-105 transition-transform"
                      >
                        <ScoreBadge score={effectiveScore} size="sm" showLabel={false} />
                      </button>
                    </div>

                    {/* Meta Row: Skills match, Rating */}
                    <div className="mt-2.5 pt-2 border-t border-border-default/60 flex items-center justify-between text-[11px] text-text-secondary">
                      {/* Must-have skills counter */}
                      {candidate.mustHaveSkillsCount !== undefined && candidate.mustHaveSkillsCount > 0 ? (
                        <div
                          className={`flex items-center gap-1 font-medium ${
                            candidate.matchedMustHaveSkillsCount === candidate.mustHaveSkillsCount
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                          title={`${candidate.matchedMustHaveSkillsCount} of ${candidate.mustHaveSkillsCount} must-have skills matched`}
                        >
                          {candidate.matchedMustHaveSkillsCount === candidate.mustHaveSkillsCount ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                          )}
                          <span>
                            {candidate.matchedMustHaveSkillsCount}/{candidate.mustHaveSkillsCount} Skills
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-muted">No req skills</span>
                      )}

                      {/* Rating & Notes pill */}
                      <div className="flex items-center gap-2">
                        {candidate.averageRating ? (
                          <div className="flex items-center gap-0.5 text-amber-600 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{candidate.averageRating}</span>
                          </div>
                        ) : null}

                        {hasNotes && (
                          <div
                            className="flex items-center gap-0.5 text-text-secondary"
                            title={`${candidate.notesCount} internal notes`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{candidate.notesCount}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stage Transition Quick Menu */}
                    <div className="mt-2.5 flex items-center justify-between gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => onSelectCandidate(candidate)}
                        className="text-brand-600 hover:text-brand-700 font-medium hover:underline flex items-center gap-0.5"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Details & Notes</span>
                      </button>

                      <div className="relative group">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors flex items-center gap-0.5"
                          title="Move Candidate Stage"
                          disabled={isMovingStage}
                        >
                          <span className="text-[10px] font-semibold text-text-secondary">Move</span>
                          <MoreVertical className="w-3 h-3" />
                        </button>

                        {/* Dropdown Menu on hover / focus */}
                        <div className="hidden group-hover:block group-focus-within:block absolute right-0 bottom-full mb-1 z-30 w-40 bg-surface border border-border-default rounded-lg shadow-lg py-1">
                          <p className="px-2.5 py-1 text-[10px] font-semibold text-text-muted uppercase border-b border-border-default">
                            Move to Stage
                          </p>
                          {KANBAN_STAGES.filter((s) => s.status !== candidate.status).map((s) => (
                            <button
                              key={s.status}
                              type="button"
                              onClick={() => onMoveStage(candidate.id, s.status)}
                              className="w-full text-left px-2.5 py-1 text-xs hover:bg-surface-hover text-text-primary transition-colors flex items-center justify-between"
                            >
                              <span>{s.label}</span>
                              <ChevronRight className="w-3 h-3 text-text-muted" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {stageCandidates.length === 0 && (
                <div className="py-10 text-center text-xs text-text-muted border border-dashed border-border-default/80 rounded-lg">
                  No candidates
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
