import React, { useState } from 'react';
import { ScoreBadge } from '../../../components/ui/ScoreBadge';
import { Button } from '../../../components/ui/Button';
import {
  PipelineCandidateDto,
  CandidateNoteDto,
  KANBAN_STAGES,
  ApplicationStatus,
} from '../types';
import {
  X,
  Star,
  Mail,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Send,
  HelpCircle,
  BarChart2,
  CheckCircle2,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { ApplicationMessageDrawer } from '../../communication/components/ApplicationMessageDrawer';
import { InterviewSchedulerModal } from '../../communication/components/InterviewSchedulerModal';
import { InterviewScorecardModal } from '../../communication/components/InterviewScorecardModal';
import { InterviewScheduleList } from '../../communication/components/InterviewScheduleList';
import type { InterviewScheduleDto } from '../../communication/types';

interface CandidateDetailDrawerProps {
  candidate: PipelineCandidateDto | null;
  isOpen: boolean;
  onClose: () => void;
  notes: CandidateNoteDto[];
  isLoadingNotes?: boolean;
  onAddNote: (content: string, rating?: number) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onOpenScoreAnalysis: (candidate: PipelineCandidateDto) => void;
  onMoveStage: (candidateId: string, stage: ApplicationStatus) => void;
  currentUserId?: string;
}

export const CandidateDetailDrawer: React.FC<CandidateDetailDrawerProps> = ({
  candidate,
  isOpen,
  onClose,
  notes,
  isLoadingNotes,
  onAddNote,
  onDeleteNote,
  onOpenScoreAnalysis,
  onMoveStage,
  currentUserId,
}) => {
  const [noteContent, setNoteContent] = useState('');
  const [starRating, setStarRating] = useState<number>(0);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);
  const [selectedInterviewForScorecard, setSelectedInterviewForScorecard] =
    useState<InterviewScheduleDto | null>(null);

  if (!isOpen || !candidate) return null;

  const stageConfig = KANBAN_STAGES.find((s) => s.status === candidate.status);
  const effectiveScore = candidate.atsScore?.overallScore ?? 0;

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      await onAddNote(noteContent.trim(), starRating > 0 ? starRating : undefined);
      setNoteContent('');
      setStarRating(0);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-2xs flex justify-end">
      <div className="w-full max-w-xl bg-surface h-full shadow-2xl border-l border-border-default flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-border-default flex items-start justify-between bg-surface-muted">
          <div className="space-y-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-text-primary truncate">
                {candidate.fullName}
              </h2>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  stageConfig ? stageConfig.badgeColor : 'bg-surface'
                }`}
              >
                {stageConfig?.label || candidate.status}
              </span>
            </div>
            <p className="text-xs text-text-secondary line-clamp-1">
              {candidate.headline || 'Applicant'} • Applied for {candidate.jobTitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors shrink-0"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stage Progression */}
          <div className="bg-surface-muted p-3.5 rounded-xl border border-border-default flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-semibold text-text-primary">Pipeline Stage:</span>
              <p className="text-[11px] text-text-secondary mt-0.5">Change candidate status</p>
            </div>
            <select
              value={candidate.status}
              onChange={(e) => onMoveStage(candidate.id, e.target.value as ApplicationStatus)}
              className="text-xs font-semibold rounded-lg px-3 py-1.5 border border-border-default bg-surface text-text-primary focus:ring-2 focus:ring-brand-600 cursor-pointer"
            >
              {KANBAN_STAGES.map((s) => (
                <option key={s.status} value={s.status}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Communication & Scheduling Actions (FR-RC-17, FR-RC-18) */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMessageDrawerOpen(true)}
              className="text-xs font-semibold gap-1.5 justify-center border-brand-200 text-brand-700 bg-brand-50/50 hover:bg-brand-100/60"
            >
              <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
              <span>Direct Chat</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSchedulerModalOpen(true)}
              className="text-xs font-semibold gap-1.5 justify-center border-emerald-200 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/60"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Schedule Call</span>
            </Button>
          </div>

          {/* Contact Details & Info */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
              Candidate Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-text-secondary">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span className="truncate">{candidate.email}</span>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>{candidate.phone}</span>
                </div>
              )}
              {candidate.location && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>{candidate.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* ATS Score Card */}
          <div className="p-4 rounded-xl border border-border-default bg-surface space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-text-primary">ATS Match Score</h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Automated resume & profile ranking
                </p>
              </div>
              <ScoreBadge score={effectiveScore} size="md" showLabel />
            </div>

            {candidate.atsScore?.manualOverrideScore !== null &&
              candidate.atsScore?.manualOverrideScore !== undefined && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <span>Manual Score Override: {candidate.atsScore.manualOverrideScore}%</span>
                  </div>
                  {candidate.atsScore.overrideReason && (
                    <p className="text-[11px] text-amber-700 italic">
                      "{candidate.atsScore.overrideReason}"
                    </p>
                  )}
                </div>
              )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenScoreAnalysis(candidate)}
              className="w-full text-xs gap-1.5 text-brand-600 justify-center"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Inspect Match Breakdown & Override Score</span>
            </Button>
          </div>

          {/* Attached CV Link */}
          {candidate.cvFileName && (
            <div className="space-y-2">
              <h3 className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                Candidate Resume / CV
              </h3>
              <div className="p-3 bg-surface-muted rounded-xl border border-border-default flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-text-primary">
                  <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="font-medium truncate">{candidate.cvFileName}</span>
                </div>
                {candidate.cvFileUrl && (
                  <a
                    href={candidate.cvFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    View Document →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Screening Answers */}
          {candidate.screeningAnswers && candidate.screeningAnswers.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
                <span>Screening Question Responses</span>
              </h3>
              <div className="space-y-2">
                {candidate.screeningAnswers.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface-muted rounded-lg border border-border-default text-xs space-y-1"
                  >
                    <p className="font-semibold text-text-primary">{item.question}</p>
                    <p className="text-brand-900 bg-surface px-2.5 py-1 rounded border border-border-default font-medium">
                      {String(item.answer)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interviews & Scorecards (FR-RC-18, FR-RC-19, FR-RC-20) */}
          <div className="pt-2 border-t border-border-default">
            <InterviewScheduleList
              applicationId={candidate.id}
              candidateName={candidate.fullName}
              jobTitle={candidate.jobTitle}
              isRecruiter={true}
              onOpenScheduleModal={() => setIsSchedulerModalOpen(true)}
              onOpenScorecard={(interview) => setSelectedInterviewForScorecard(interview)}
            />
          </div>

          {/* Internal Team Notes & Star Ratings (FR-RC-15) */}
          <div className="space-y-3 pt-2 border-t border-border-default">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                Internal Team Notes ({notes.length})
              </h3>
              <span className="text-[10px] text-text-muted">Visible only to your company</span>
            </div>

            {/* Add Note Form */}
            <form onSubmit={handlePostNote} className="space-y-2.5 bg-surface-muted p-3.5 rounded-xl border border-border-default">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">
                  Optional Star Rating:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star === starRating ? 0 : star)}
                      className="p-0.5 transition-transform hover:scale-110"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= starRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-text-muted hover:text-amber-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add private evaluation notes, interview feedback, or remarks..."
                rows={3}
                className="w-full p-2.5 text-xs text-text-primary bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 placeholder:text-text-muted"
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingNote || !noteContent.trim()}
                  className="text-xs gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmittingNote ? 'Saving...' : 'Post Internal Note'}</span>
                </Button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-2.5 pt-1">
              {isLoadingNotes && (
                <div className="py-4 text-center text-xs text-text-muted">
                  Loading notes...
                </div>
              )}

              {!isLoadingNotes &&
                notes.map((note) => {
                  const canDelete =
                    currentUserId === note.authorId || !currentUserId;

                  return (
                    <div
                      key={note.id}
                      className="p-3 bg-surface rounded-xl border border-border-default space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary">
                            {note.authorName}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {new Date(note.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {note.rating && (
                            <div className="flex items-center gap-0.5 text-amber-600 font-semibold text-xs">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{note.rating}</span>
                            </div>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => onDeleteNote(note.id)}
                              className="text-text-muted hover:text-rose-600 p-1 rounded transition-colors"
                              title="Delete note"
                              aria-label="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-text-secondary whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  );
                })}

              {!isLoadingNotes && notes.length === 0 && (
                <p className="py-4 text-center text-xs text-text-muted">
                  No internal notes added yet. Leave a note or star rating above.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-surface-muted border-t border-border-default flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenScoreAnalysis(candidate)}
            className="text-xs gap-1.5"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Score Breakdown</span>
          </Button>
        </div>
      </div>

      {/* Direct Messaging Drawer */}
      <ApplicationMessageDrawer
        isOpen={isMessageDrawerOpen}
        onClose={() => setIsMessageDrawerOpen(false)}
        applicationId={candidate.id}
        candidateName={candidate.fullName}
        jobTitle={candidate.jobTitle}
        currentUserId={currentUserId}
      />

      {/* Interview Scheduler Modal */}
      <InterviewSchedulerModal
        isOpen={isSchedulerModalOpen}
        onClose={() => setIsSchedulerModalOpen(false)}
        applicationId={candidate.id}
        candidateName={candidate.fullName}
        jobTitle={candidate.jobTitle}
      />

      {/* Structured Scorecard Evaluation Modal */}
      <InterviewScorecardModal
        isOpen={Boolean(selectedInterviewForScorecard)}
        onClose={() => setSelectedInterviewForScorecard(null)}
        interview={selectedInterviewForScorecard}
        applicationId={candidate.id}
      />
    </div>
  );
};
