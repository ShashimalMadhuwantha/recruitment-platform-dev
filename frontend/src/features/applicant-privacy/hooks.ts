import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicantPrivacyApi } from './api';
import type {
  UpdateNotificationPreferenceDto,
  BlockCompanyInputDto,
  RequestAccountErasureDto,
} from './types';

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['applicant', 'privacy', 'preferences'],
    queryFn: applicantPrivacyApi.getPreferences,
    staleTime: 60 * 1000,
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateNotificationPreferenceDto) =>
      applicantPrivacyApi.updatePreferences(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['applicant', 'privacy', 'preferences'], updated);
    },
  });
};

export const useBlockedCompanies = () => {
  return useQuery({
    queryKey: ['applicant', 'privacy', 'blocked-companies'],
    queryFn: applicantPrivacyApi.getBlockedCompanies,
    staleTime: 60 * 1000,
  });
};

export const useBlockCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BlockCompanyInputDto) => applicantPrivacyApi.blockCompany(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['applicant', 'privacy', 'blocked-companies'],
      });
      // Invalidate applicant profile if cached
      queryClient.invalidateQueries({
        queryKey: ['applicant-profile'],
      });
    },
  });
};

export const useUnblockCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) => applicantPrivacyApi.unblockCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['applicant', 'privacy', 'blocked-companies'],
      });
      queryClient.invalidateQueries({
        queryKey: ['applicant-profile'],
      });
    },
  });
};

export const useExportPersonalData = () => {
  return useMutation({
    mutationFn: async () => {
      const data = await applicantPrivacyApi.exportPersonalData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-applicant-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return data;
    },
  });
};

export const useRequestAccountErasure = () => {
  return useMutation({
    mutationFn: (input: RequestAccountErasureDto) =>
      applicantPrivacyApi.requestAccountErasure(input),
  });
};
