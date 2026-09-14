import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobVacancyApi } from './api';
import type {
  CreateJobVacancyDto,
  UpdateJobVacancyDto,
  JobStatus,
} from './types';

export const useCompanyJobs = (params?: {
  search?: string;
  status?: JobStatus;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['job-vacancies', params],
    queryFn: () => jobVacancyApi.listJobs(params),
  });
};

export const useJobDetails = (id?: string) => {
  return useQuery({
    queryKey: ['job-vacancies', id],
    queryFn: () => jobVacancyApi.getJob(id!),
    enabled: !!id,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJobVacancyDto) => jobVacancyApi.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-vacancies'] });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobVacancyDto }) =>
      jobVacancyApi.updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-vacancies'] });
    },
  });
};

export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      jobVacancyApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-vacancies'] });
    },
  });
};

export const useCloneJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobVacancyApi.cloneJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-vacancies'] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobVacancyApi.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-vacancies'] });
    },
  });
};

export const useCheckCompliance = () => {
  return useMutation({
    mutationFn: (data: { title?: string; description?: string; requirementsSummary?: string }) =>
      jobVacancyApi.checkCompliance(data),
  });
};
