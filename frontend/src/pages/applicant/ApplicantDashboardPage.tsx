import React from 'react';
import { Card } from '../../components/ui/Card';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { StatusPill } from '../../components/ui/StatusPill';
import { Button } from '../../components/ui/Button';

export const ApplicantDashboardPage: React.FC = () => {
  const applications = [
    {
      id: '1',
      title: 'Senior TypeScript Engineer',
      company: 'TechCorp Solutions',
      status: 'INTERVIEW',
      score: 89,
      appliedDate: 'Sep 05, 2026',
    },
    {
      id: '2',
      title: 'Full Stack React / Node Developer',
      company: 'Innovate Labs',
      status: 'SCREENING',
      score: 76,
      appliedDate: 'Sep 08, 2026',
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Applicant Dashboard</h1>
          <p className="text-xs text-text-secondary mt-1">Track your job applications and ATS match scores</p>
        </div>
        <Button variant="primary" size="sm">
          Browse Open Vacancies
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary">Profile Completeness</p>
            <p className="text-2xl font-bold text-brand-900 mt-1">90%</p>
          </div>
          <ScoreBadge score={90} size="sm" showLabel={false} />
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Active Applications</p>
          <p className="text-2xl font-bold text-brand-900 mt-1">2</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Average Match Score</p>
          <p className="text-2xl font-bold text-brand-900 mt-1">82.5%</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-text-primary mb-4">My Applications</h2>
        <div className="divide-y divide-border-default">
          {applications.map((app) => (
            <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{app.title}</h3>
                <p className="text-xs text-text-secondary">{app.company} • Applied on {app.appliedDate}</p>
              </div>
              <div className="flex items-center gap-4">
                <ScoreBadge score={app.score} size="sm" />
                <StatusPill status={app.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ApplicantDashboardPage;
