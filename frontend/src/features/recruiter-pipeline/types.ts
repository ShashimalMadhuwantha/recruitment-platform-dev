import {
  PipelineCandidateDto,
  CandidateNoteDto,
  CreateCandidateNoteDto,
  MoveCandidateStageDto,
  BulkMoveCandidateStageDto,
  CandidateComparisonResponseDto,
  CandidateComparisonItemDto,
  TalentPoolCandidateDto,
  TalentPoolSearchParams,
  ApplicationStatus,
  ScoreBand,
} from '@recruitment-platform/shared';

export type {
  PipelineCandidateDto,
  CandidateNoteDto,
  CreateCandidateNoteDto,
  MoveCandidateStageDto,
  BulkMoveCandidateStageDto,
  CandidateComparisonResponseDto,
  CandidateComparisonItemDto,
  TalentPoolCandidateDto,
  TalentPoolSearchParams,
};

export type { ApplicationStatus, ScoreBand };

export type ViewMode = 'kanban' | 'table';

export interface PipelineFilterState {
  search: string;
  status: string; // empty for all, or comma-separated statuses
  scoreBand: string; // empty for all, or HIGH, MID, LOW
  sortBy: 'appliedAt' | 'overallScore' | 'fullName' | 'rating';
  sortOrder: 'asc' | 'desc';
  viewMode: ViewMode;
}

export interface KanbanStageColumn {
  status: ApplicationStatus;
  label: string;
  badgeColor: string;
  headerBg: string;
  accentColor: string;
}

export const KANBAN_STAGES: KanbanStageColumn[] = [
  {
    status: 'APPLIED' as ApplicationStatus,
    label: 'Applied',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    headerBg: 'bg-slate-50',
    accentColor: 'border-slate-400',
  },
  {
    status: 'SCREENING' as ApplicationStatus,
    label: 'Screening',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',
    headerBg: 'bg-blue-50/50',
    accentColor: 'border-blue-400',
  },
  {
    status: 'SHORTLISTED' as ApplicationStatus,
    label: 'Shortlisted',
    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    headerBg: 'bg-indigo-50/50',
    accentColor: 'border-indigo-400',
  },
  {
    status: 'INTERVIEW' as ApplicationStatus,
    label: 'Interview',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-300',
    headerBg: 'bg-purple-50/50',
    accentColor: 'border-purple-400',
  },
  {
    status: 'OFFER' as ApplicationStatus,
    label: 'Offer',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-300',
    headerBg: 'bg-amber-50/50',
    accentColor: 'border-amber-400',
  },
  {
    status: 'HIRED' as ApplicationStatus,
    label: 'Hired',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    headerBg: 'bg-emerald-50/50',
    accentColor: 'border-emerald-500',
  },
  {
    status: 'REJECTED' as ApplicationStatus,
    label: 'Rejected',
    badgeColor: 'bg-rose-100 text-rose-700 border-rose-300',
    headerBg: 'bg-rose-50/50',
    accentColor: 'border-rose-400',
  },
];
