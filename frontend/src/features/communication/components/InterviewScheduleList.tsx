import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  Download,
  Award,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useApplicationInterviews, useUpdateInterviewStatus } from '../hooks';
import { communicationApi } from '../api';
import type { InterviewScheduleDto } from '../types';

interface InterviewScheduleListProps {
  applicationId: string;
  candidateName?: string;
  jobTitle?: string;
  isRecruiter?: boolean;
  onOpenScheduleModal?: () => void;
  onOpenScorecard?: (interview: InterviewScheduleDto) => void;
}

export const InterviewScheduleList: React.FC<InterviewScheduleListProps> = ({
  applicationId,
  candidateName = 'Candidate',
  jobTitle = 'Job Position',
  isRecruiter = true,
  onOpenScheduleModal,
  onOpenScorecard,
}) => {
  const { data: interviews = [], isLoading } = useApplicationInterviews(applicationId);
  const updateStatusMutation = useUpdateInterviewStatus(applicationId);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadIcs = async (interview: InterviewScheduleDto) => {
    setDownloadingId(interview.id);
    try {
      await communicationApi.downloadIcsCalendar(interview.id, interview.title);
    } catch (err) {
      console.error('Failed to download .ics file:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: InterviewScheduleDto['status']) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'RESCHEDULED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-surface-muted text-text-secondary border-border-default';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
            Interviews & Scheduling ({interviews.length})
          </h3>
        </div>

        {isRecruiter && onOpenScheduleModal && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenScheduleModal}
            className="text-xs gap-1 text-brand-600 border-brand-200 hover:bg-brand-50"
          >
            <Plus className="w-3 h-3" />
            <span>Schedule Interview</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-xs text-text-muted">Loading scheduled interviews...</div>
      ) : interviews.length === 0 ? (
        <div className="p-4 bg-surface-muted rounded-xl border border-border-default text-center space-y-2">
          <Calendar className="w-6 h-6 text-text-muted mx-auto opacity-40" />
          <p className="text-xs font-medium text-text-primary">No interviews scheduled</p>
          <p className="text-[11px] text-text-secondary">
            {isRecruiter
              ? 'Schedule video screens, system design rounds, or on-site interviews.'
              : 'Interviews scheduled with the hiring team will appear here.'}
          </p>
          {isRecruiter && onOpenScheduleModal && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onOpenScheduleModal}
              className="text-xs gap-1 mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule First Interview</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((item) => {
            const dateObj = new Date(item.scheduledAt);
            const isCompleted = item.status === 'COMPLETED';

            return (
              <div
                key={item.id}
                className="p-4 bg-surface rounded-xl border border-border-default space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs text-text-primary truncate">
                        {item.title}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-secondary pt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-text-primary">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        {dateObj.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
                        {item.durationMins} mins)
                      </span>
                      <span className="text-[11px] text-text-muted">
                        Interviewer: <strong className="text-text-secondary">{item.interviewerName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* iCalendar Export */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadIcs(item)}
                    disabled={downloadingId === item.id}
                    className="text-xs gap-1 text-text-secondary hover:text-brand-600 shrink-0"
                    title="Add to Google / Apple / Outlook Calendar (.ics)"
                  >
                    <Download className="w-3 h-3" />
                    <span className="hidden sm:inline">Add to Cal</span>
                  </Button>
                </div>

                {/* Meeting Link / Location */}
                {item.videoLink ? (
                  <div className="p-2.5 bg-brand-50/60 rounded-lg border border-brand-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-brand-900 min-w-0">
                      <Video className="w-4 h-4 text-brand-600 shrink-0" />
                      <span className="truncate font-medium">{item.videoLink}</span>
                    </div>
                    <a
                      href={item.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                    >
                      <span>Join Call</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : item.location ? (
                  <div className="p-2.5 bg-surface-muted rounded-lg border border-border-default flex items-center gap-2 text-xs text-text-secondary">
                    {item.interviewType === 'PHONE' ? (
                      <Phone className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    )}
                    <span>{item.location}</span>
                  </div>
                ) : null}

                {/* Notes / Agenda */}
                {item.notes && (
                  <div className="text-[11px] text-text-secondary bg-surface-muted p-2 rounded-lg border border-border-default">
                    <span className="font-semibold text-text-primary">Agenda: </span>
                    {item.notes}
                  </div>
                )}

                {/* Recruiter Evaluation Status & Actions */}
                {isRecruiter && (
                  <div className="pt-2 border-t border-border-default flex items-center justify-between flex-wrap gap-2">
                    <div>
                      {item.hasFeedback ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Scorecard Evaluated</span>
                          {item.feedbacks && item.feedbacks.length > 0 && item.feedbacks[0]?.recommendation && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold ml-1">
                              {item.feedbacks[0].recommendation.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-muted">Awaiting evaluation feedback</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {onOpenScorecard && !item.hasFeedback && (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => onOpenScorecard(item)}
                          className="text-xs gap-1"
                        >
                          <Award className="w-3 h-3" />
                          <span>Submit Scorecard</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
