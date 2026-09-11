import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi, SubmitApplicationResponse, WithdrawApplicationResponse } from './api';
import type { SubmitApplicationDto } from '@recruitment-platform/shared';

export const useMyApplications = () => {
  return useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationApi.getMyApplications(),
  });
};

export const useApplicationDetails = (id?: string) => {
  return useQuery({
    queryKey: ['application-details', id],
    queryFn: () => applicationApi.getApplicationDetails(id!),
    enabled: !!id,
  });
};

export const useSubmitApplication = () => {
  const queryClient = useQueryClient();
  return useMutation<SubmitApplicationResponse, Error, SubmitApplicationDto>({
    mutationFn: (dto: SubmitApplicationDto) => applicationApi.submitApplication(dto),
    onSuccess: (_data, dto) => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['public-job', dto.jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-search'] });
    },
  });
};

export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();
  return useMutation<WithdrawApplicationResponse, Error, { id: string; reason?: string }>({
    mutationFn: ({ id, reason }) => applicationApi.withdrawApplication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
    },
  });
};

export const useJobApplications = (jobId?: string) => {
  return useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: () => applicationApi.getJobApplications(jobId!),
    enabled: Boolean(jobId),
  });
};

