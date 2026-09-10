import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { Button } from '../../components/ui/Button';
import { CandidateScoreAnalysisModal } from '../../features/ats-scoring/components/CandidateScoreAnalysisModal';

export const RecruiterPipelinePage: React.FC = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<{
    id: string;
    name: string;
    role: string;
    score: number;
  } | null>(null);

  const stages = [
    {
      name: 'Applied',
      count: 2,
      candidates: [
        { id: '3d9d1665-7707-4c8a-aa3c-a1f6d211bd5f', name: 'Maria Silva', role: 'Frontend UI/UX Specialist', score: 92.0 },
        { id: '967b20bd-0608-435b-9bbb-cf83cd8d55a6', name: 'David Kim', role: 'Backend Python Developer', score: 64.0 },
      ],
    },
    {
      name: 'Screening',
      count: 2,
      candidates: [
        { id: 'cc4e7238-878f-4c85-94d0-a37ed36d93c4', name: 'Shashimal Madhuwantha', role: 'Software Engineering Undergraduate — Full-Stack', score: 88.5 },
        { id: '7ee65d2d-cadd-482e-8576-b4034413ce42', name: 'Alex Turner', role: 'Senior Full-Stack Engineer', score: 94.0 },
      ],
    },
    {
      name: 'Interview',
      count: 2,
      candidates: [
        { id: '78ab7876-ed9b-4f84-b570-f09c6ac1f8b8', name: 'Sarah Chen', role: 'TypeScript Cloud Architect', score: 96.5 },
        { id: '6cdaa203-6b65-4c97-8006-3ba13b01b7ce', name: 'James Wilson', role: 'Senior React Developer', score: 84.5 },
      ],
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
          <p className="text-xs text-text-secondary mt-1">5 Active Candidates • Auto-ranked by ATS Match Score • Click any card to inspect score breakdown & calibration</p>
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
                <Card
                  key={c.name}
                  dense
                  onClick={() => setSelectedCandidate(c)}
                  className="hover:border-brand-600/50 hover:shadow-sm cursor-pointer space-y-2 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-text-primary hover:text-brand-600">{c.name}</p>
                      <p className="text-[11px] text-text-secondary">{c.role}</p>
                    </div>
                    <ScoreBadge score={c.score} size="sm" showLabel={false} />
                  </div>
                  <div className="pt-1 flex items-center justify-between text-[11px] text-brand-600 font-medium">
                    <span>Inspect Match Breakdown →</span>
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

      {/* Epic 7 ATS Candidate Score Analysis & Override Modal */}
      {selectedCandidate && (
        <CandidateScoreAnalysisModal
          applicationId={selectedCandidate.id}
          candidateName={selectedCandidate.name}
          jobTitle="Senior Full Stack Engineer (React / Node.js)"
          isOpen={Boolean(selectedCandidate)}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
};

export default RecruiterPipelinePage;

