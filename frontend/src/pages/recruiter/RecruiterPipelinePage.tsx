import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { Button } from '../../components/ui/Button';
import { CandidateScoreAnalysisModal } from '../../features/ats-scoring/components/CandidateScoreAnalysisModal';
import { useCompanyJobs } from '../../features/job-vacancy/hooks';
import { Briefcase, Users } from 'lucide-react';

interface PipelineCandidate {
  id: string;
  name: string;
  role: string;
  score: number;
}

interface PipelineStage {
  name: string;
  candidates: PipelineCandidate[];
}

export const RecruiterPipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: jobsData, isLoading: isLoadingJobs } = useCompanyJobs({ limit: 50 });
  const jobs = jobsData?.items || [];

  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null);

  // Read selected jobId from search params, default to first available job
  const requestedJobId = searchParams.get('jobId');
  const activeJob = (jobs.length > 0 && requestedJobId)
    ? jobs.find((j) => j.id === requestedJobId) || jobs[0]
    : jobs[0];

  // Pipeline stage data mapped by job vacancy ID
  const jobPipelines: Record<string, PipelineStage[]> = {
    // Job 1: Senior Full-Stack Engineer (React / Node.js)
    '36a383f4-4d3f-48a7-a4bb-f527e951c5ea': [
      {
        name: 'Applied',
        candidates: [
          { id: '3d9d1665-7707-4c8a-aa3c-a1f6d211bd5f', name: 'Maria Silva', role: 'Frontend UI/UX Specialist', score: 92.0 },
          { id: '967b20bd-0608-435b-9bbb-cf83cd8d55a6', name: 'David Kim', role: 'Backend Python Developer', score: 64.0 },
        ],
      },
      {
        name: 'Screening',
        candidates: [
          { id: 'cc4e7238-878f-4c85-94d0-a37ed36d93c4', name: 'Shashimal Madhuwantha', role: 'Software Engineering Undergraduate — Full-Stack', score: 46.0 },
          { id: '7ee65d2d-cadd-482e-8576-b4034413ce42', name: 'Alex Turner', role: 'Senior Full-Stack Engineer', score: 94.0 },
        ],
      },
      {
        name: 'Interview',
        candidates: [
          { id: '78ab7876-ed9b-4f84-b570-f09c6ac1f8b8', name: 'Sarah Chen', role: 'TypeScript Cloud Architect', score: 96.5 },
          { id: '6cdaa203-6b65-4c97-8006-3ba13b01b7ce', name: 'James Wilson', role: 'Senior React Developer', score: 84.5 },
        ],
      },
      {
        name: 'Offer',
        candidates: [],
      },
    ],
    // Job 2: Full Stack React / Node Developer
    '77b21a88-251c-4b68-b80c-99d9804b32c0': [
      {
        name: 'Applied',
        candidates: [
          { id: 'cd87551d-fcd4-44ce-bffe-3fe30dc1c88b', name: 'Shashimal Madhuwantha', role: 'Software Engineering Undergraduate — Full-Stack', score: 63.0 },
        ],
      },
      {
        name: 'Screening',
        candidates: [],
      },
      {
        name: 'Interview',
        candidates: [],
      },
      {
        name: 'Offer',
        candidates: [],
      },
    ],
  };

  const defaultEmptyStages: PipelineStage[] = [
    { name: 'Applied', candidates: [] },
    { name: 'Screening', candidates: [] },
    { name: 'Interview', candidates: [] },
    { name: 'Offer', candidates: [] },
  ];

  // Resolve active stages for the selected vacancy
  const stages = activeJob && jobPipelines[activeJob.id]
    ? jobPipelines[activeJob.id]
    : defaultEmptyStages;

  const totalCandidates = stages.reduce((acc, stage) => acc + stage.candidates.length, 0);

  const handleJobChange = (jobId: string) => {
    setSearchParams({ jobId });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">
      {/* Top Header & Job Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-900">
              {activeJob ? activeJob.title : 'Candidate Pipeline'}
            </h1>
            {activeJob && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                {activeJob.status}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {totalCandidates} Active Candidate{totalCandidates === 1 ? '' : 's'} • Auto-ranked by ATS Match Score • Click any candidate card to inspect score breakdown & calibration
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Vacancy Selector Dropdown */}
          {jobs.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="pipeline-job-select" className="text-xs font-semibold text-text-secondary whitespace-nowrap">
                Vacancy:
              </label>
              <select
                id="pipeline-job-select"
                value={activeJob?.id || ''}
                onChange={(e) => handleJobChange(e.target.value)}
                className="text-xs font-medium text-text-primary bg-surface border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-sm"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.applicationsCount || (jobPipelines[job.id]?.reduce((a, s) => a + s.candidates.length, 0) ?? 0)} candidates)
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button variant="primary" size="sm" onClick={() => navigate('/recruiter/jobs/new')}>
            + Post New Vacancy
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoadingJobs && (
        <div className="py-12 text-center text-xs text-text-secondary">
          Loading pipeline vacancies...
        </div>
      )}

      {/* Empty State when no jobs exist */}
      {!isLoadingJobs && jobs.length === 0 && (
        <div className="py-16 text-center bg-surface rounded-xl border border-border-default space-y-3">
          <Briefcase className="w-10 h-10 text-text-muted mx-auto" />
          <h2 className="text-base font-semibold text-text-primary">No job vacancies created yet</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Create your first vacancy to start receiving applicant submissions and inspecting automated ATS match scoring.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/recruiter/jobs/new')}>
              + Post Vacancy Now
            </Button>
          </div>
        </div>
      )}

      {/* Kanban Stages Grid */}
      {!isLoadingJobs && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stages.map((stage) => (
            <div key={stage.name} className="bg-surface-muted p-3.5 rounded-lg border border-border-default space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border-default">
                <span className="text-xs font-semibold text-text-primary">{stage.name}</span>
                <span className="text-xs bg-surface px-2 py-0.5 rounded-full border border-border-default font-medium text-text-secondary">
                  {stage.candidates.length}
                </span>
              </div>

              <div className="space-y-2">
                {stage.candidates.map((c) => (
                  <Card
                    key={c.id}
                    dense
                    onClick={() => setSelectedCandidate(c)}
                    className="hover:border-brand-600/50 hover:shadow-sm cursor-pointer space-y-2 transition-all bg-surface"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-text-primary hover:text-brand-600">{c.name}</p>
                        <p className="text-[11px] text-text-secondary line-clamp-1">{c.role}</p>
                      </div>
                      <ScoreBadge score={c.score} size="sm" showLabel={false} />
                    </div>
                    <div className="pt-1 flex items-center justify-between text-[11px] text-brand-600 font-medium">
                      <span>Inspect Match Breakdown →</span>
                    </div>
                  </Card>
                ))}

                {stage.candidates.length === 0 && (
                  <div className="py-8 text-center text-xs text-text-muted border border-dashed border-border-default rounded-md">
                    No candidates in {stage.name.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Epic 7 ATS Candidate Score Analysis & Override Modal */}
      {selectedCandidate && (
        <CandidateScoreAnalysisModal
          applicationId={selectedCandidate.id}
          candidateName={selectedCandidate.name}
          jobTitle={activeJob?.title || 'Job Vacancy'}
          isOpen={Boolean(selectedCandidate)}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
};

export default RecruiterPipelinePage;
