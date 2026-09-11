import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recruiterPipelineApi } from './api';
import type {
  MoveCandidateStageDto,
  BulkMoveCandidateStageDto,
  CreateCandidateNoteDto,
  TalentPoolSearchParams,
} from './types';

export const usePipelineApplications = (
  jobId?: string,
  params?: {
    search?: string;
    status?: string;
    scoreBand?: string;
    sortBy?: string;
    sortOrder?: string;
  }
) => {
  return useQuery({
    queryKey: ['pipeline-applications', jobId, params],
    queryFn: () => recruiterPipelineApi.getJobApplications(jobId!, params),
    enabled: Boolean(jobId),
  });
};

export const useMoveCandidateStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      dto,
    }: {
      applicationId: string;
      dto: MoveCandidateStageDto;
    }) => recruiterPipelineApi.moveCandidateStage(applicationId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-applications'] });
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['company-jobs'] });
    },
  });
};

export const useBulkMoveCandidates = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkMoveCandidateStageDto) =>
      recruiterPipelineApi.bulkMoveCandidates(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-applications'] });
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['company-jobs'] });
    },
  });
};

export const useCandidateNotes = (applicationId?: string) => {
  return useQuery({
    queryKey: ['candidate-notes', applicationId],
    queryFn: () => recruiterPipelineApi.getCandidateNotes(applicationId!),
    enabled: Boolean(applicationId),
  });
};

export const useAddCandidateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      dto,
    }: {
      applicationId: string;
      dto: CreateCandidateNoteDto;
    }) => recruiterPipelineApi.addCandidateNote(applicationId, dto),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['candidate-notes', vars.applicationId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-applications'] });
    },
  });
};

export const useDeleteCandidateNote = (applicationId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => recruiterPipelineApi.deleteCandidateNote(noteId),
    onSuccess: () => {
      if (applicationId) {
        queryClient.invalidateQueries({ queryKey: ['candidate-notes', applicationId] });
      }
      queryClient.invalidateQueries({ queryKey: ['pipeline-applications'] });
    },
  });
};

export const useCompareCandidates = () => {
  return useMutation({
    mutationFn: (applicationIds: string[]) =>
      recruiterPipelineApi.compareCandidates(applicationIds),
  });
};

export const useTalentPool = (params: TalentPoolSearchParams) => {
  return useQuery({
    queryKey: ['talent-pool', params],
    queryFn: () => recruiterPipelineApi.searchTalentPool(params),
  });
};
