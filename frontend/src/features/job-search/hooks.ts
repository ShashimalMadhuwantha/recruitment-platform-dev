import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobSearchApi } from './api';
import type { JobSearchFilters } from '@recruitment-platform/shared';

export const useJobSearch = (filters?: JobSearchFilters) => {
  return useQuery({
    queryKey: ['job-search', filters],
    queryFn: () => jobSearchApi.searchJobs(filters),
  });
};

export const usePublicJobDetails = (id?: string) => {
  return useQuery({
    queryKey: ['public-job', id],
    queryFn: () => jobSearchApi.getJobDetails(id!),
    enabled: !!id,
  });
};

export const useSavedJobs = () => {
  return useQuery({
    queryKey: ['saved-jobs'],
    queryFn: () => jobSearchApi.getSavedJobs(),
  });
};

export const useToggleSaveJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => jobSearchApi.toggleSaveJob(jobId),
    onSuccess: (_data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['job-search'] });
      queryClient.invalidateQueries({ queryKey: ['public-job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    },
  });
};
