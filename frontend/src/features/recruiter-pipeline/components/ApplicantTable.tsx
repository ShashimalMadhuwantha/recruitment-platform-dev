import React from 'react';
import { ScoreBadge } from '../../../components/ui/ScoreBadge';
import {
  PipelineCandidateDto,
  ApplicationStatus,
  KANBAN_STAGES,
} from '../types';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart2,
} from 'lucide-react';

interface ApplicantTableProps {
  candidates: PipelineCandidateDto[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSelectCandidate: (candidate: PipelineCandidateDto) => void;
  onOpenScoreAnalysis: (candidate: PipelineCandidateDto) => void;
  onMoveStage: (candidateId: string, targetStage: ApplicationStatus) => void;
  isMovingStage?: boolean;
}

export const ApplicantTable: React.FC<ApplicantTableProps> = ({
  candidates,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSelectCandidate,
  onOpenScoreAnalysis,
  onMoveStage,
  isMovingStage,
}) => {
  const isAllSelected =
    candidates.length > 0 && selectedIds.length === candidates.length;

  return (
    <div className="bg-surface rounded-xl border border-border-default overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-muted border-b border-border-default text-text-secondary font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all candidates"
                  className="w-4 h-4 rounded border-border-default text-brand-600 focus:ring-brand-600 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4">Candidate</th>
              <th className="py-3.5 px-4 text-center">ATS Match Score</th>
              <th className="py-3.5 px-4">Must-Have Skills</th>
              <th className="py-3.5 px-4">Pipeline Stage</th>
              <th className="py-3.5 px-4 text-center">Team Rating</th>
              <th className="py-3.5 px-4">Applied</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default/70">
            {candidates.map((candidate) => {
              const isSelected = selectedIds.includes(candidate.id);
              const effectiveScore = candidate.atsScore?.overallScore ?? 0;
              const stageConfig = KANBAN_STAGES.find((s) => s.status === candidate.status);

              return (
                <tr
                  key={candidate.id}
                  className={`hover:bg-surface-hover/70 transition-colors ${
                    isSelected ? 'bg-brand-50/20' : ''
                  }`}
                >
                  {/* Selection Checkbox */}
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(candidate.id)}
                      aria-label={`Select ${candidate.fullName}`}
                      className="w-4 h-4 rounded border-border-default text-brand-600 focus:ring-brand-600 cursor-pointer"
                    />
                  </td>

                  {/* Candidate Name & Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-200 shrink-0">
                        {candidate.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onSelectCandidate(candidate)}
                          className="font-bold text-text-primary hover:text-brand-600 text-left line-clamp-1"
                        >
                          {candidate.fullName}
                        </button>
                        <div className="text-[11px] text-text-secondary flex items-center gap-2 mt-0.5">
                          <span>{candidate.email}</span>
                          {candidate.location && (
                            <>
                              <span>•</span>
                              <span>{candidate.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ATS Match Score */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onOpenScoreAnalysis(candidate)}
                      title="Inspect ATS Score Breakdown & Calibrate"
                      className="inline-block hover:scale-105 transition-transform"
                    >
                      <ScoreBadge score={effectiveScore} size="sm" showLabel />
                    </button>
                  </td>

                  {/* Must-Have Skills */}
                  <td className="py-3.5 px-4">
                    {candidate.mustHaveSkillsCount !== undefined && candidate.mustHaveSkillsCount > 0 ? (
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          candidate.matchedMustHaveSkillsCount === candidate.mustHaveSkillsCount
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-300'
                        }`}
                      >
                        {candidate.matchedMustHaveSkillsCount === candidate.mustHaveSkillsCount ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>
                          {candidate.matchedMustHaveSkillsCount} / {candidate.mustHaveSkillsCount} Matched
                        </span>
                      </div>
                    ) : (
                      <span className="text-text-muted text-[11px]">—</span>
                    )}
                  </td>

                  {/* Stage Dropdown */}
                  <td className="py-3.5 px-4">
                    <select
                      value={candidate.status}
                      disabled={isMovingStage}
                      onChange={(e) => onMoveStage(candidate.id, e.target.value as ApplicationStatus)}
                      className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none focus:ring-2 focus:ring-brand-600 cursor-pointer transition-all ${
                        stageConfig ? stageConfig.badgeColor : 'bg-surface border-border-default'
                      }`}
                    >
                      {KANBAN_STAGES.map((s) => (
                        <option key={s.status} value={s.status}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Team Rating */}
                  <td className="py-3.5 px-4 text-center">
                    {candidate.averageRating ? (
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{candidate.averageRating}</span>
                        <span className="text-text-muted font-normal text-[10px]">
                          ({candidate.notesCount})
                        </span>
                      </div>
                    ) : (
                      <span className="text-text-muted text-xs">—</span>
                    )}
                  </td>

                  {/* Applied Date */}
                  <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                    {new Date(candidate.appliedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenScoreAnalysis(candidate)}
                        title="Score Analysis & Override"
                        className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <BarChart2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectCandidate(candidate)}
                        title="View Candidate Details & Team Notes"
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {candidates.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-text-muted">
                  No candidates match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
