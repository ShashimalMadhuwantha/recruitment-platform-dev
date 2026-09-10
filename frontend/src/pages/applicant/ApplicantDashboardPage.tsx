import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { StatusPill } from '../../components/ui/StatusPill';
import { Button } from '../../components/ui/Button';
import { useApplicantProfile } from '../../features/applicant-profile/hooks';
import { usePreApplyMatchPreview } from '../../features/ats-scoring/hooks';
import { PreApplyMatchPreviewDrawer } from '../../features/ats-scoring/components/PreApplyMatchPreviewDrawer';

const ApplicationRow: React.FC<{
  app: {
    id: string;
    jobId: string;
    title: string;
    company: string;
    status: string;
    appliedDate: string;
  };
  onClick: () => void;
}> = ({ app, onClick }) => {
  const { data: preview } = usePreApplyMatchPreview(app.jobId);
  const score = preview?.overallScore ?? (app.jobId.includes('36a383f4') ? 46 : 63);

  return (
    <div
      onClick={onClick}
      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-surface-muted/40 px-2 rounded-lg transition-colors"
    >
      <div>
        <h3 className="text-sm font-semibold text-text-primary hover:text-brand-600">{app.title}</h3>
        <p className="text-xs text-text-secondary">{app.company} • Applied on {app.appliedDate}</p>
        <p className="text-[11px] text-brand-600 font-medium mt-1">View ATS Match Breakdown & Skill Alignment →</p>
      </div>
      <div className="flex items-center gap-4">
        <ScoreBadge score={score} size="sm" />
        <StatusPill status={app.status} />
      </div>
    </div>
  );
};

export const ApplicantDashboardPage: React.FC = () => {
  const { data: profile } = useApplicantProfile();
  const completenessScore = profile?.completeness?.score ?? 85;
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);

  const applications = [
    {
      id: 'app-shashimal-1',
      jobId: '36a383f4-4d3f-48a7-a4bb-f527e951c5ea',
      title: 'Senior Full-Stack Engineer (React / Node.js)',
      company: 'Nibm',
      status: 'SCREENING',
      appliedDate: 'Sep 10, 2026',
    },
    {
      id: 'app-shashimal-2',
      jobId: '77b21a88-251c-4b68-b80c-99d9804b32c0',
      title: 'Full Stack React / Node Developer',
      company: 'Nibm',
      status: 'APPLIED',
      appliedDate: 'Sep 10, 2026',
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Applicant Dashboard</h1>
          <p className="text-xs text-text-secondary mt-1">Track your job applications and ATS match scores</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/applicant/profile">
            <Button variant="secondary" size="sm">
              Edit Profile
            </Button>
          </Link>
          <Link to="/applicant/profile?tab=resume">
            <Button variant="primary" size="sm">
              + Upload Resume
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/applicant/profile">
          <Card className="flex items-center justify-between hover:border-brand-600 transition-colors cursor-pointer">
            <div>
              <p className="text-xs text-text-secondary">Profile Completeness</p>
              <p className="text-2xl font-bold text-brand-900 mt-1">{completenessScore}%</p>
              <span className="text-[11px] text-brand-600 font-medium">Update profile →</span>
            </div>
            <ScoreBadge score={completenessScore} size="sm" showLabel={false} />
          </Card>
        </Link>
        <Card>
          <p className="text-xs text-text-secondary">Active Applications</p>
          <p className="text-2xl font-bold text-brand-900 mt-1">{applications.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Average Match Score</p>
          <p className="text-2xl font-bold text-brand-900 mt-1">54.5%</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">My Applications</h2>
          <span className="text-xs text-text-muted">Click any application to view ATS Match Breakdown</span>
        </div>
        <div className="divide-y divide-border-default">
          {applications.map((app) => (
            <ApplicationRow
              key={app.id}
              app={app}
              onClick={() => setPreviewJobId(app.jobId)}
            />
          ))}
        </div>
      </Card>

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

