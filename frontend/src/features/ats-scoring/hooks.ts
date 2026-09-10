import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { atsScoringApi } from './api';
import type { OverrideAtsScoreDto } from './types';

export const ATS_QUERY_KEYS = {
  all: ['ats'] as const,
  preApplyPreview: (jobId: string) => [...ATS_QUERY_KEYS.all, 'pre-apply', jobId] as const,
  applicationScore: (applicationId: string) => [...ATS_QUERY_KEYS.all, 'application', applicationId] as const,
};

/**
 * Hook to retrieve on-demand pre-apply match preview for an applicant
 */
export function usePreApplyMatchPreview(jobId: string, enabled = true) {
  return useQuery({
    queryKey: ATS_QUERY_KEYS.preApplyPreview(jobId),
    queryFn: () => atsScoringApi.getPreApplyMatchPreview(jobId),
    enabled: Boolean(jobId) && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Hook to fetch detailed ATS score for an application
 */
export function useApplicationAtsScore(applicationId: string, enabled = true) {
  return useQuery({
    queryKey: ATS_QUERY_KEYS.applicationScore(applicationId),
    queryFn: () => atsScoringApi.getApplicationAtsScore(applicationId),
    enabled: Boolean(applicationId) && enabled,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Mutation hook to manually override an application ATS score
 */
export function useOverrideAtsScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, data }: { applicationId: string; data: OverrideAtsScoreDto }) =>
      atsScoringApi.overrideAtsScore(applicationId, data),
    onSuccess: (updatedScore, variables) => {
      queryClient.setQueryData(
        ATS_QUERY_KEYS.applicationScore(variables.applicationId),
        updatedScore
      );
      queryClient.invalidateQueries({
        queryKey: ATS_QUERY_KEYS.applicationScore(variables.applicationId),
      });
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

/**
 * Mutation hook to recompute an application score
 */
export function useRecomputeApplicationScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) => atsScoringApi.recomputeApplicationScore(applicationId),
    onSuccess: (_, applicationId) => {
      queryClient.invalidateQueries({
        queryKey: ATS_QUERY_KEYS.applicationScore(applicationId),
      });
    },
  });
}

/**
 * Mutation hook to batch re-score all applications for a job vacancy
 */
export function useBatchRescoreJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => atsScoringApi.batchRescoreJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
