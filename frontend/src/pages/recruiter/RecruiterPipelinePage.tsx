import React from 'react';
import { Card } from '../../components/ui/Card';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { Button } from '../../components/ui/Button';

export const RecruiterPipelinePage: React.FC = () => {
  const stages = [
    {
      name: 'Applied',
      count: 3,
      candidates: [
        { name: 'Alex Johnson', role: 'Full Stack Dev', score: 88 },
        { name: 'Maria Silva', role: 'Frontend Engineer', score: 92 },
        { name: 'David Kim', role: 'Backend Developer', score: 64 },
      ],
    },
    {
      name: 'Screening',
      count: 1,
      candidates: [{ name: 'Sarah Chen', role: 'TypeScript Architect', score: 95 }],
    },
    {
      name: 'Interview',
      count: 1,
      candidates: [{ name: 'James Wilson', role: 'Senior React Dev', score: 84 }],
    },
    {
      name: 'Offer',
      count: 0,
      candidates: [],
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Senior Full Stack Engineer — Pipeline</h1>
          <p className="text-xs text-text-secondary mt-1">5 Active Candidates • Auto-ranked by ATS Match Score</p>
        </div>
        <Button variant="primary" size="sm">+ Post New Vacancy</Button>
      </div>

      {/* Kanban Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <div key={stage.name} className="bg-surface-muted p-3.5 rounded-lg border border-border-default space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <span className="text-xs font-semibold text-text-primary">{stage.name}</span>
              <span className="text-xs bg-surface px-2 py-0.5 rounded-full border border-border-default font-medium text-text-secondary">
                {stage.count}
              </span>
            </div>

            <div className="space-y-2">
              {stage.candidates.map((c) => (
                <Card key={c.name} dense className="hover:border-brand-600/50 cursor-pointer space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{c.name}</p>
                      <p className="text-[11px] text-text-secondary">{c.role}</p>
                    </div>
                    <ScoreBadge score={c.score} size="sm" showLabel={false} />
                  </div>
                </Card>
              ))}

              {stage.candidates.length === 0 && (
                <div className="py-6 text-center text-xs text-text-muted">
                  No candidates in stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecruiterPipelinePage;
