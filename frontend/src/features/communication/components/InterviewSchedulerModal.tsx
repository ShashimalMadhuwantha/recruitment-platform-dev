import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  FileText,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useScheduleInterview } from '../hooks';
import type { CreateInterviewDto } from '../types';

interface InterviewSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName?: string;
  jobTitle?: string;
}

export const InterviewSchedulerModal: React.FC<InterviewSchedulerModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  candidateName = 'Candidate',
  jobTitle = 'Job Position',
}) => {
  // Default date: tomorrow at 10:00 AM local time
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    // Format YYYY-MM-DDTHH:mm
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [title, setTitle] = useState('Round 1: Technical & System Architecture');
  const [interviewType, setInterviewType] = useState<'VIDEO' | 'PHONE' | 'IN_PERSON'>('VIDEO');
  const [scheduledAt, setScheduledAt] = useState(getDefaultDateTime());
  const [durationMins, setDurationMins] = useState(60);
  const [timezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [videoLink, setVideoLink] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const scheduleMutation = useScheduleInterview(applicationId);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Interview title is required.');
      return;
    }

    if (!scheduledAt) {
      setError('Please select a valid date and time.');
      return;
    }

    const payload: CreateInterviewDto = {
      title: title.trim(),
      interviewType,
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMins: Number(durationMins),
      timezone,
      videoLink: videoLink.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await scheduleMutation.mutateAsync(payload);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to schedule interview. Please try again.');
    }
  };

  // WCAG 2.1 AA: Dismiss modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl bg-surface rounded-2xl shadow-2xl border border-border-default overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-border-default bg-surface-muted flex items-start justify-between">
          <div className="space-y-0.5">
            <h2 id="interview-modal-title" className="text-base font-bold text-text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Schedule Candidate Interview</span>
            </h2>
            <p className="text-xs text-text-secondary">
              For <span className="font-semibold text-text-primary">{candidateName}</span> • {jobTitle}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="interview-title" className="font-semibold text-text-primary">
              Interview Title *
            </label>
            <input
              id="interview-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Round 1: Technical & System Architecture"
              className="w-full p-2.5 bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-text-primary"
              required
            />
          </div>

          {/* Interview Type */}
          <div className="space-y-1.5">
            <label className="font-semibold text-text-primary">Interview Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setInterviewType('VIDEO')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors ${
                  interviewType === 'VIDEO'
                    ? 'border-brand-600 bg-brand-50/70 text-brand-700 font-semibold shadow-2xs'
                    : 'border-border-default bg-surface text-text-secondary hover:border-text-muted'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video Call</span>
              </button>

              <button
                type="button"
                onClick={() => setInterviewType('PHONE')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors ${
                  interviewType === 'PHONE'
                    ? 'border-brand-600 bg-brand-50/70 text-brand-700 font-semibold shadow-2xs'
                    : 'border-border-default bg-surface text-text-secondary hover:border-text-muted'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Phone Screen</span>
              </button>

              <button
                type="button"
                onClick={() => setInterviewType('IN_PERSON')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors ${
                  interviewType === 'IN_PERSON'
                    ? 'border-brand-600 bg-brand-50/70 text-brand-700 font-semibold shadow-2xs'
                    : 'border-border-default bg-surface text-text-secondary hover:border-text-muted'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>In-Person</span>
              </button>
            </div>
          </div>

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-text-primary flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                <span>Date & Time *</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full p-2.5 bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-text-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-text-primary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                <span>Duration (Minutes)</span>
              </label>
              <select
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
                className="w-full p-2.5 bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-text-primary cursor-pointer"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (Standard)</option>
                <option value={90}>90 Minutes</option>
                <option value={120}>120 Minutes</option>
              </select>
            </div>
          </div>

          {/* Meeting Link / Location */}
          {interviewType === 'VIDEO' ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-text-primary flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-brand-600" />
                  <span>Video Conference Link</span>
                </label>
                <span className="text-[10px] text-brand-600 font-medium flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3" /> Auto-generated if left empty
                </span>
              </div>
              <input
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://meet.google.com/xyz or leave empty for instant Jitsi room"
                className="w-full p-2.5 bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-text-primary placeholder:text-text-muted"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="font-semibold text-text-primary flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span>{interviewType === 'PHONE' ? 'Phone Number or Dial-In' : 'Office Location / Room'}</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={
                  interviewType === 'PHONE'
                    ? 'Candidate phone number or conference line'
                    : 'e.g. Building 2, Room 405 (Seattle HQ)'
                }
                className="w-full p-2.5 bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-text-primary placeholder:text-text-muted"
              />
            </div>
          )}

          {/* Candidate Preparation Notes / Agenda */}
          <div className="space-y-1.5">
            <label className="font-semibold text-text-primary flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-brand-600" />
              <span>Agenda & Preparation Guidelines (Visible to Candidate)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. System design discussion focused on scalable microservices. Please have your development environment ready."
              rows={3}
              className="w-full p-2.5 bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-text-primary placeholder:text-text-muted"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] text-text-muted bg-surface-muted p-2.5 rounded-lg border border-border-default">
            <Globe className="w-3.5 h-3.5 shrink-0 text-brand-600" />
            <span>
              Timezone: <strong className="text-text-primary">{timezone}</strong>. Calendar invite (.ics) will automatically synchronize with candidate's local time.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border-default">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={scheduleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={scheduleMutation.isPending}
              className="gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{scheduleMutation.isPending ? 'Scheduling...' : 'Schedule & Notify Candidate'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
