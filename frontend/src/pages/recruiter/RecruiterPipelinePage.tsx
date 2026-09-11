import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { CandidateScoreAnalysisModal } from '../../features/ats-scoring/components/CandidateScoreAnalysisModal';
import { useCompanyJobs } from '../../features/job-vacancy/hooks';
import {
  usePipelineApplications,
  useMoveCandidateStage,
  useBulkMoveCandidates,
  useCandidateNotes,
  useAddCandidateNote,
  useDeleteCandidateNote,
  useCompareCandidates,
} from '../../features/recruiter-pipeline/hooks';
import {
  PipelineCandidateDto,
  PipelineFilterState,
  ApplicationStatus,
} from '../../features/recruiter-pipeline/types';
import { PipelineFilterBar } from '../../features/recruiter-pipeline/components/PipelineFilterBar';
import { KanbanBoard } from '../../features/recruiter-pipeline/components/KanbanBoard';
import { ApplicantTable } from '../../features/recruiter-pipeline/components/ApplicantTable';
import { BulkActionBar } from '../../features/recruiter-pipeline/components/BulkActionBar';
import { CandidateComparisonModal } from '../../features/recruiter-pipeline/components/CandidateComparisonModal';
import { CandidateDetailDrawer } from '../../features/recruiter-pipeline/components/CandidateDetailDrawer';
import { Briefcase, Loader2, Users, Compass } from 'lucide-react';
import { useAuth } from '../../app/providers';

export const RecruiterPipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch company jobs
  const { data: jobsData, isLoading: isLoadingJobs } = useCompanyJobs({ limit: 50 });
  const jobs = jobsData?.items || [];

  // Read selected jobId from search params, default to first available job
  const requestedJobId = searchParams.get('jobId');
  const activeJob =
    jobs.length > 0 && requestedJobId
      ? jobs.find((j) => j.id === requestedJobId) || jobs[0]
      : jobs[0];

  // Pipeline Filter State
  const [filters, setFilters] = useState<PipelineFilterState>({
    search: '',
    status: '',
    scoreBand: '',
    sortBy: 'appliedAt',
    sortOrder: 'desc',
    viewMode: 'kanban',
  });

  // Selected candidate IDs for bulk actions / comparison
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals and drawer state
  const [inspectingCandidate, setInspectingCandidate] = useState<PipelineCandidateDto | null>(null);
  const [detailCandidate, setDetailCandidate] = useState<PipelineCandidateDto | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Fetch applications for active job with filters
  const {
    data: candidates = [],
    isLoading: isLoadingCandidates,
    refetch: refetchCandidates,
  } = usePipelineApplications(activeJob?.id, {
    search: filters.search || undefined,
    status: filters.status || undefined,
    scoreBand: filters.scoreBand || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  // Mutations
  const moveStageMutation = useMoveCandidateStage();
  const bulkMoveMutation = useBulkMoveCandidates();
  const compareMutation = useCompareCandidates();

  // Notes queries and mutations for drawer
  const { data: candidateNotes = [], isLoading: isLoadingNotes } = useCandidateNotes(
    detailCandidate?.id
  );
  const addNoteMutation = useAddCandidateNote();
  const deleteNoteMutation = useDeleteCandidateNote(detailCandidate?.id);

  // Job selection change
  const handleJobChange = (jobId: string) => {
    setSearchParams({ jobId });
    setSelectedIds([]);
    setDetailCandidate(null);
  };

  // Filter updates
  const handleFilterChange = (updates: Partial<PipelineFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      scoreBand: '',
      sortBy: 'appliedAt',
      sortOrder: 'desc',
      viewMode: filters.viewMode,
    });
  };

  // Selection toggle
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map((c) => c.id));
    }
  };

  // Single candidate stage movement
  const handleMoveStage = async (candidateId: string, stage: ApplicationStatus) => {
    await moveStageMutation.mutateAsync({
      applicationId: candidateId,
      dto: { stage },
    });
    // Update active drawer candidate status if open
    if (detailCandidate && detailCandidate.id === candidateId) {
      setDetailCandidate((prev) => (prev ? { ...prev, status: stage } : null));
    }
  };

  // Bulk stage movement
  const handleBulkMoveStage = async (stage: ApplicationStatus) => {
    if (selectedIds.length === 0) return;
    await bulkMoveMutation.mutateAsync({
      applicationIds: selectedIds,
      stage,
      notes: `Bulk moved to ${stage}`,
    });
    setSelectedIds([]);
  };

  // Open comparison modal
  const handleOpenCompare = () => {
    if (selectedIds.length >= 2 && selectedIds.length <= 4) {
      compareMutation.mutate(selectedIds);
      setIsCompareOpen(true);
    }
  };

  // Add Note
  const handleAddNote = async (content: string, rating?: number) => {
    if (!detailCandidate) return;
    await addNoteMutation.mutateAsync({
      applicationId: detailCandidate.id,
      dto: { content, rating },
    });
  };

  // Delete Note
  const handleDeleteNote = async (noteId: string) => {
    await deleteNoteMutation.mutateAsync(noteId);
  };

  const selectedCandidatesList = candidates.filter((c) => selectedIds.includes(c.id));

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header & Job Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-brand-900 tracking-tight">
              {activeJob ? activeJob.title : 'Candidate Pipeline'}
            </h1>
            {activeJob && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                {activeJob.status}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1 flex items-center gap-2 flex-wrap">
            <span>
              <strong className="text-text-primary">{candidates.length}</strong> Candidate
              {candidates.length === 1 ? '' : 's'} in Pipeline
            </span>
            <span>•</span>
            <span>Automated ATS Match Scoring & Explainability</span>
            <span>•</span>
            <span>7 Progression Stages (Applied to Hired)</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Vacancy Selector Dropdown */}
          {jobs.length > 0 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="pipeline-job-select"
                className="text-xs font-semibold text-text-secondary whitespace-nowrap"
              >
                Vacancy:
              </label>
              <select
                id="pipeline-job-select"
                value={activeJob?.id || ''}
                onChange={(e) => handleJobChange(e.target.value)}
                className="text-xs font-medium text-text-primary bg-surface border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-2xs"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.applicationsCount ?? 0} applicants)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Talent Pool Sourcing Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/recruiter/talent-pool')}
            className="text-xs gap-1.5 border-brand-600 text-brand-600 hover:bg-brand-50"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Talent Sourcing Directory</span>
          </Button>

          {/* Post New Vacancy */}
          <Button variant="primary" size="sm" onClick={() => navigate('/recruiter/jobs/new')}>
            + Post Vacancy
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoadingJobs && (
        <div className="py-16 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          <span>Loading pipeline vacancies...</span>
        </div>
      )}

      {/* Empty State when no jobs exist */}
      {!isLoadingJobs && jobs.length === 0 && (
        <div className="py-20 text-center bg-surface rounded-2xl border border-border-default space-y-4 max-w-lg mx-auto p-8 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">No job vacancies created yet</h2>
          <p className="text-xs text-text-secondary">
            Publish your first job vacancy to receive applications, view automated ATS match scores,
            and manage candidates across all 7 pipeline stages.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/recruiter/jobs/new')}>
              + Post Vacancy Now
            </Button>
          </div>
        </div>
      )}

      {/* Main Pipeline View with Filter Bar */}
      {!isLoadingJobs && jobs.length > 0 && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <PipelineFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            totalCandidates={candidates.length}
          />

          {isLoadingCandidates && (
            <div className="flex items-center gap-2 text-xs text-text-secondary py-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Updating candidates...</span>
            </div>
          )}

          {/* Kanban Board View */}
          {filters.viewMode === 'kanban' && (
            <KanbanBoard
              candidates={candidates}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectCandidate={(c) => setDetailCandidate(c)}
              onOpenScoreAnalysis={(c) => setInspectingCandidate(c)}
              onMoveStage={handleMoveStage}
              isMovingStage={moveStageMutation.isPending}
            />
          )}

          {/* Table List View */}
          {filters.viewMode === 'table' && (
            <ApplicantTable
              candidates={candidates}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onSelectCandidate={(c) => setDetailCandidate(c)}
              onOpenScoreAnalysis={(c) => setInspectingCandidate(c)}
              onMoveStage={handleMoveStage}
              isMovingStage={moveStageMutation.isPending}
            />
          )}
        </div>
      )}

      {/* Bulk Action Toolbar */}
      <BulkActionBar
        selectedCandidates={selectedCandidatesList}
        onClearSelection={() => setSelectedIds([])}
        onBulkMoveStage={handleBulkMoveStage}
        onOpenCompare={handleOpenCompare}
        isBulkMoving={bulkMoveMutation.isPending}
      />

      {/* Candidate Score Breakdown & Manual Override Modal (FR-RC-13, FR-ATS-07) */}
      {inspectingCandidate && (
        <CandidateScoreAnalysisModal
          applicationId={inspectingCandidate.id}
          candidateName={inspectingCandidate.fullName}
          jobTitle={activeJob?.title || 'Job Vacancy'}
          isOpen={Boolean(inspectingCandidate)}
          onClose={() => {
            setInspectingCandidate(null);
            refetchCandidates();
          }}
        />
      )}

      {/* Candidate Detail & Notes Drawer (FR-RC-15) */}
      <CandidateDetailDrawer
        candidate={detailCandidate}
        isOpen={Boolean(detailCandidate)}
        onClose={() => setDetailCandidate(null)}
        notes={candidateNotes}
        isLoadingNotes={isLoadingNotes}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onOpenScoreAnalysis={(c) => setInspectingCandidate(c)}
        onMoveStage={handleMoveStage}
        currentUserId={user?.id}
      />

      {/* Side-by-Side Candidate Comparison Modal (FR-RC-16) */}
      <CandidateComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        data={compareMutation.data || null}
        isLoading={compareMutation.isPending}
        onInspectScore={(appId, candidateName) => {
          setIsCompareOpen(false);
          const found = candidates.find((c) => c.id === appId);
          if (found) {
            setInspectingCandidate(found);
          }
        }}
      />
    </div>
  );
};

export default RecruiterPipelinePage;
