import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyDiscoveryApi } from './api';
import type { CompanyDiscoveryQueryDto } from './types';

export const useCompanyDirectory = (query: CompanyDiscoveryQueryDto = {}) => {
  return useQuery({
    queryKey: ['companies', 'directory', query],
    queryFn: () => companyDiscoveryApi.searchCompanies(query),
    staleTime: 60 * 1000,
  });
};

export const useCompanyProfile = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['companies', 'profile', idOrSlug],
    queryFn: () => companyDiscoveryApi.getCompanyProfile(idOrSlug),
    enabled: Boolean(idOrSlug),
    staleTime: 60 * 1000,
  });
};

export const useCompanyJobs = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['companies', 'jobs', idOrSlug],
    queryFn: () => companyDiscoveryApi.getCompanyJobs(idOrSlug),
    enabled: Boolean(idOrSlug),
    staleTime: 60 * 1000,
  });
};

export const useToggleCompanyFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) => companyDiscoveryApi.toggleCompanyFollow(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

export const useFollowedCompanies = (page = 1, limit = 12) => {
  return useQuery({
    queryKey: ['companies', 'following', page, limit],
    queryFn: () => companyDiscoveryApi.getFollowedCompanies(page, limit),
    staleTime: 60 * 1000,
  });
};
