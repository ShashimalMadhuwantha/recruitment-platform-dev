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
} from 'lucide-react';

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
        <div className="flex items-center gap-3">
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
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-muted/50 transition"
                >
                  <div
                    className="space-y-1 cursor-pointer flex-1"
                    onClick={() => setPreviewJobId(app.jobId)}
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
                        Attached Resume: <span className="font-medium text-text-secondary">{app.cvFileName}</span>
                      </p>
                    )}
                    <p className="text-[11px] text-brand-600 font-medium pt-0.5">
                      Inspect ATS Match Breakdown & Recommendations →
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {app.overallScore !== null && app.overallScore !== undefined ? (
                      <ScoreBadge score={app.overallScore} size="sm" />
                    ) : (
                      <span className="text-xs text-text-muted font-medium">Scoring...</span>
                    )}

                    <StatusPill status={app.status} />

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
    </div>
  );
};

export default ApplicantDashboardPage;
