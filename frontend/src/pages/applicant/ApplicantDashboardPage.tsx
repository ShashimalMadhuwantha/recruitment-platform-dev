import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { StatusPill } from '../../components/ui/StatusPill';
import { Button } from '../../components/ui/Button';
import { useApplicantProfile } from '../../features/applicant-profile/hooks';
import { useMyApplications, useWithdrawApplication } from '../../features/application/hooks';
import { useSavedJobs, useToggleSaveJob } from '../../features/job-search/hooks';
import { PreApplyMatchPreviewDrawer } from '../../features/ats-scoring/components/PreApplyMatchPreviewDrawer';
import type { ApplicantApplicationListItem } from '@recruitment-platform/shared';
import {
  Briefcase,
  Bookmark,
  Calendar,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Trash2,
  MessageSquare,
  Video,
  X,
  HeartPulse,
  TrendingUp,
  Sparkles,
  FileCheck,
  CheckCircle,
} from 'lucide-react';
import { ApplicationMessageDrawer } from '../../features/communication/components/ApplicationMessageDrawer';
import { InterviewScheduleList } from '../../features/communication/components/InterviewScheduleList';
import { OfferReviewModal } from '../../features/offers/components/OfferReviewModal';
import { CvHealthCheckModal } from '../../features/career-tools/components/CvHealthCheckModal';
import { ProfileImprovementDrawer } from '../../features/career-tools/components/ProfileImprovementDrawer';
import { ApplicationScoreBreakdownModal } from '../../features/career-tools/components/ApplicationScoreBreakdownModal';

export const ApplicantDashboardPage: React.FC = () => {
  const { data: profile } = useApplicantProfile();
  const completenessScore = profile?.completeness?.score ?? 85;

  const { data: applications = [], isLoading: isLoadingApps } = useMyApplications();
  const { data: savedJobs = [], isLoading: isLoadingSaved } = useSavedJobs();
  const withdrawMutation = useWithdrawApplication();
  const toggleSaveMutation = useToggleSaveJob();

  const [activeTab, setActiveTab] = useState<'applications' | 'saved'>('applications');
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [withdrawingApp, setWithdrawingApp] = useState<ApplicantApplicationListItem | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [messagingApp, setMessagingApp] = useState<ApplicantApplicationListItem | null>(null);
  const [interviewsApp, setInterviewsApp] = useState<ApplicantApplicationListItem | null>(null);
  const [reviewingOfferApp, setReviewingOfferApp] = useState<ApplicantApplicationListItem | null>(null);
  const [scoreBreakdownApp, setScoreBreakdownApp] = useState<ApplicantApplicationListItem | null>(null);
  const [isCvHealthModalOpen, setIsCvHealthModalOpen] = useState(false);
  const [isImprovementDrawerOpen, setIsImprovementDrawerOpen] = useState(false);

  // Calculate stats from live applications
  const validScores = applications
    .filter((a) => a.overallScore !== null && a.overallScore !== undefined)
    .map((a) => Number(a.overallScore));

  const averageScore = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 0;

  const handleConfirmWithdraw = async () => {
    if (!withdrawingApp) return;
    try {
      await withdrawMutation.mutateAsync({
        id: withdrawingApp.id,
        reason: withdrawReason.trim() || undefined,
      });
      setWithdrawingApp(null);
      setWithdrawReason('');
    } catch (err) {
      console.error('Failed to withdraw application:', err);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Applicant Dashboard</h1>
          <p className="text-xs text-text-secondary mt-1">
            Track your job applications, withdrawal requests, and ATS match scoring
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCvHealthModalOpen(true)}
            className="border-brand-200 text-brand-700 bg-brand-50/50 hover:bg-brand-100/60 text-xs gap-1.5"
          >
            <HeartPulse className="w-3.5 h-3.5 text-brand-600" />
            <span>CV Health Diagnostic</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImprovementDrawerOpen(true)}
            className="border-emerald-200 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/60 text-xs gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Career Insights</span>
          </Button>

          <Link to="/jobs">
            <Button variant="secondary" size="sm">
              <Briefcase className="w-3.5 h-3.5 mr-1.5" />
              Browse Jobs
            </Button>
          </Link>
          <Link to="/applicant/profile">
            <Button variant="primary" size="sm">
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/applicant/profile">
          <Card className="flex items-center justify-between hover:border-brand-600 transition-colors cursor-pointer p-6">
            <div>
              <p className="text-xs text-text-secondary">Profile Completeness</p>
              <p className="text-2xl font-bold text-brand-900 mt-1">{completenessScore}%</p>
              <span className="text-[11px] text-brand-600 font-medium">Update profile →</span>
            </div>
            <ScoreBadge score={completenessScore} size="sm" showLabel={false} />
          </Card>
        </Link>
        <Card className="p-6">
          <p className="text-xs text-text-secondary">Active Applications</p>
          <p className="text-2xl font-bold text-brand-900 mt-1">{applications.length}</p>
          <span className="text-[11px] text-text-muted">Submitted to verified employers</span>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-text-secondary">Average ATS Match Score</p>
          <p className="text-2xl font-bold text-brand-900 mt-1">
            {averageScore > 0 ? `${averageScore}%` : '—'}
          </p>
          <span className="text-[11px] text-text-muted">Based on evaluated submissions</span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-border-default">
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'applications'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          My Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'saved'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Saved Jobs ({savedJobs.length})
        </button>
      </div>

      {/* Tab 1: My Applications */}
      {activeTab === 'applications' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-5 border-b border-border-default flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary">Application History & Status</h2>
            <span className="text-xs text-text-secondary">Click row to inspect live ATS breakdown</span>
          </div>

          {isLoadingApps ? (
            <div className="py-16 text-center text-xs text-text-secondary">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center space-y-3 p-6">
              <Briefcase className="w-10 h-10 text-text-muted mx-auto" />
              <h3 className="text-sm font-bold text-text-primary">No applications submitted yet</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Explore open vacancies on our job board and apply with your structured profile and CV.
              </p>
              <div className="pt-2">
                <Link to="/jobs">
                  <Button variant="primary" size="sm">
                    Explore Vacancies
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border-default">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-5 space-y-3 hover:bg-surface-muted/50 transition"
                >
                  {/* Official Job Offer Extended Callout Banner (FR-RC-24) */}
                  {app.jobOffer && (
                    <div
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        app.jobOffer.status === 'ACCEPTED'
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                          : app.jobOffer.status === 'DECLINED'
                          ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                          : app.jobOffer.status === 'EXPIRED'
                          ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                          : 'bg-blue-50/90 border-blue-300 text-blue-950 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileCheck className="w-5 h-5 text-brand-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold">
                            {app.jobOffer.status === 'ACCEPTED'
                              ? 'Official Offer Formally Accepted!'
                              : app.jobOffer.status === 'DECLINED'
                              ? 'Offer Declined'
                              : app.jobOffer.status === 'EXPIRED'
                              ? 'Offer Expired'
                              : 'Official Job Offer Extended!'}
                          </p>
                          <p className="text-[11px] opacity-90">
                            Base:{' '}
                            <strong>
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: app.jobOffer.currency || 'USD',
                                maximumFractionDigits: 0,
                              }).format(app.jobOffer.baseSalary)}
                            </strong>{' '}
                            • Starts:{' '}
                            {new Date(app.jobOffer.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => setReviewingOfferApp(app)}
                        className={`text-xs gap-1.5 shrink-0 ${
                          app.jobOffer.status === 'SENT'
                            ? 'bg-brand-600 hover:bg-brand-700 text-white'
                            : 'bg-surface text-text-primary border border-border-default hover:bg-surface-muted'
                        }`}
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>
                          {app.jobOffer.status === 'SENT' ? 'Review & Respond' : 'View Offer Terms'}
                        </span>
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div
                      className="space-y-1 cursor-pointer flex-1"
                      onClick={() => setScoreBreakdownApp(app)}
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-brand-900 hover:text-brand-600 transition">
                          {app.jobTitle}
                        </h3>
                        <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                      </div>
                      <p className="text-xs text-text-secondary">
                        {app.companyName} • {app.location || 'Remote'} • Applied on{' '}
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                      {app.cvFileName && (
                        <p className="text-[11px] text-text-muted">
                          Attached Resume:{' '}
                          <span className="font-medium text-text-secondary">{app.cvFileName}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-brand-600 font-semibold pt-0.5 flex items-center gap-1 hover:underline">
                        <Sparkles className="w-3 h-3" />
                        <span>Inspect Match Breakdown & Skill Gap Analysis (FR-AP-22) →</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                      {app.overallScore !== null && app.overallScore !== undefined ? (
                        <button
                          type="button"
                          onClick={() => setScoreBreakdownApp(app)}
                          className="hover:scale-105 transition-transform"
                          title="Click to view ATS score & skill gap breakdown"
                        >
                          <ScoreBadge score={app.overallScore} size="sm" />
                        </button>
                      ) : (
                        <span className="text-xs text-text-muted font-medium">Scoring...</span>
                      )}

                      <StatusPill status={app.status} />

                      {/* In-app messaging action */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 text-brand-600 border-brand-200 hover:bg-brand-50"
                        onClick={() => setMessagingApp(app)}
                        title="Direct Chat with Hiring Team"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Messages</span>
                      </Button>

                      {/* Interview schedule details action */}
                      {app.status === 'INTERVIEW' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1 text-emerald-700 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60"
                          onClick={() => setInterviewsApp(app)}
                          title="View scheduled interview, join link, and calendar export"
                        >
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>Interviews</span>
                        </Button>
                      )}

                      {/* Withdrawal action */}
                      {app.canWithdraw && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-rose-600 hover:bg-rose-50"
                          onClick={() => setWithdrawingApp(app)}
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Saved Jobs */}
      {activeTab === 'saved' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-5 border-b border-border-default flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary">Bookmarked Vacancies</h2>
            <span className="text-xs text-text-secondary">{savedJobs.length} saved roles</span>
          </div>

          {isLoadingSaved ? (
            <div className="py-16 text-center text-xs text-text-secondary">Loading saved vacancies...</div>
          ) : savedJobs.length === 0 ? (
            <div className="py-16 text-center space-y-3 p-6">
              <Bookmark className="w-10 h-10 text-text-muted mx-auto" />
              <h3 className="text-sm font-bold text-text-primary">No bookmarked vacancies</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Bookmark interesting roles from the job board to review and apply to later.
              </p>
              <div className="pt-2">
                <Link to="/jobs">
                  <Button variant="primary" size="sm">
                    Browse Jobs
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border-default">
              {savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-muted/50 transition"
                >
                  <div className="space-y-1">
                    <Link
                      to={`/jobs/${job.jobId}`}
                      className="text-sm font-bold text-brand-900 hover:text-brand-600 transition"
                    >
                      {job.jobTitle}
                    </Link>
                    <p className="text-xs text-text-secondary">
                      {job.companyName} • {job.location || 'Remote'} • Saved on{' '}
                      {new Date(job.savedAt).toLocaleDateString()}
                    </p>
                    {job.salaryMin && job.salaryMax && (
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} / year
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => toggleSaveMutation.mutate(job.jobId)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link to={`/jobs/${job.jobId}`}>
                      <Button variant="primary" size="sm">
                        View & Apply
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Withdrawal Confirmation Dialog */}
      {withdrawingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Withdraw Application?</h3>
                <p className="text-xs text-text-secondary mt-1">
                  Are you sure you want to withdraw your application for{' '}
                  <strong>{withdrawingApp.jobTitle}</strong> at <strong>{withdrawingApp.companyName}</strong>?
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="withdrawReason" className="block text-xs font-semibold text-text-primary mb-1">
                Reason for Withdrawal (Optional)
              </label>
              <textarea
                id="withdrawReason"
                rows={3}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Accepted another offer, location mismatch, etc..."
                className="w-full text-xs p-2.5 rounded-lg border border-border-default focus:ring-2 focus:ring-brand-600 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setWithdrawingApp(null)}
                disabled={withdrawMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmWithdraw}
                isLoading={withdrawMutation.isPending}
              >
                Confirm Withdrawal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Epic 7 ATS Pre-Apply Match Preview Drawer */}
      {previewJobId && (
        <PreApplyMatchPreviewDrawer
          jobId={previewJobId}
          isOpen={Boolean(previewJobId)}
          onClose={() => setPreviewJobId(null)}
        />
      )}

      {/* Epic 12 In-App Direct Messaging Drawer */}
      {messagingApp && (
        <ApplicationMessageDrawer
          isOpen={Boolean(messagingApp)}
          onClose={() => setMessagingApp(null)}
          applicationId={messagingApp.id}
          candidateName="Hiring Team"
          jobTitle={messagingApp.jobTitle}
        />
      )}

      {/* Epic 12 Interview Schedules & Video Call Modal */}
      {interviewsApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-surface rounded-2xl shadow-2xl border border-border-default overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border-default bg-surface-muted flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>Your Scheduled Interviews</span>
                </h3>
                <p className="text-xs text-text-secondary">
                  For {interviewsApp.jobTitle} at {interviewsApp.companyName}
                </p>
              </div>
              <button
                onClick={() => setInterviewsApp(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <InterviewScheduleList
                applicationId={interviewsApp.id}
                candidateName="You"
                jobTitle={interviewsApp.jobTitle}
                isRecruiter={false}
              />
            </div>

            <div className="p-3 bg-surface-muted border-t border-border-default flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setInterviewsApp(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Epic 13 Applicant Offer Review Modal (FR-RC-24) */}
      {reviewingOfferApp && reviewingOfferApp.jobOffer && (
        <OfferReviewModal
          isOpen={Boolean(reviewingOfferApp)}
          onClose={() => setReviewingOfferApp(null)}
          offer={reviewingOfferApp.jobOffer}
          candidateName={
            profile?.firstName && profile?.lastName
              ? `${profile.firstName} ${profile.lastName}`
              : 'Applicant'
          }
        />
      )}

      {/* Epic 13 Applicant Post-Apply Score Feedback & Skill Gap Analysis (FR-AP-22) */}
      {scoreBreakdownApp && (
        <ApplicationScoreBreakdownModal
          isOpen={Boolean(scoreBreakdownApp)}
          onClose={() => setScoreBreakdownApp(null)}
          application={scoreBreakdownApp}
        />
      )}

      {/* Epic 13 CV Health Diagnostic Modal (FR-AP-24) */}
      <CvHealthCheckModal
        isOpen={isCvHealthModalOpen}
        onClose={() => setIsCvHealthModalOpen(false)}
      />

      {/* Epic 13 Career Insights & Missing Skills Drawer (FR-AP-23) */}
      <ProfileImprovementDrawer
        isOpen={isImprovementDrawerOpen}
        onClose={() => setIsImprovementDrawerOpen(false)}
      />
    </div>
  );
};

export default ApplicantDashboardPage;
