import { useQuery } from '@tanstack/react-query';
import { careerToolsApi } from './api';

export const useCvHealthCheck = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['cv-health-check'],
    queryFn: () => careerToolsApi.runCvHealthCheck(),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useProfileImprovement = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['profile-improvement'],
    queryFn: () => careerToolsApi.getProfileImprovementSuggestions(),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });
};
