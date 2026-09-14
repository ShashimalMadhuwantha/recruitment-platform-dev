import { useQuery, useMutation } from '@tanstack/react-query';
import { analyticsApi } from './api';
import type { AnalyticsFilterParams } from '@recruitment-platform/shared';

export const ANALYTICS_QUERY_KEYS = {
  all: ['analytics'] as const,
  summary: (filters?: AnalyticsFilterParams) => ['analytics', 'summary', filters] as const,
  funnel: (filters?: AnalyticsFilterParams) => ['analytics', 'funnel', filters] as const,
  sources: (filters?: AnalyticsFilterParams) => ['analytics', 'sources', filters] as const,
  velocity: (filters?: AnalyticsFilterParams) => ['analytics', 'velocity', filters] as const,
  scoreDistribution: (filters?: AnalyticsFilterParams) => ['analytics', 'score-distribution', filters] as const,
  diversity: (jobId?: string) => ['analytics', 'diversity', jobId] as const,
  reports: (filters?: AnalyticsFilterParams) => ['analytics', 'reports', filters] as const,
};

export const useCompanySummary = (filters?: AnalyticsFilterParams) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.summary(filters),
    queryFn: () => analyticsApi.getSummary(filters),
    staleTime: 60 * 1000,
  });
};

export const useFunnelMetrics = (filters?: AnalyticsFilterParams) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.funnel(filters),
    queryFn: () => analyticsApi.getFunnel(filters),
    staleTime: 60 * 1000,
  });
};

export const useSourceAttribution = (filters?: AnalyticsFilterParams) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.sources(filters),
    queryFn: () => analyticsApi.getSources(filters),
    staleTime: 60 * 1000,
  });
};

export const useApplicationVelocity = (filters?: AnalyticsFilterParams) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.velocity(filters),
    queryFn: () => analyticsApi.getVelocity(filters),
    staleTime: 60 * 1000,
  });
};

export const useScoreDistribution = (filters?: AnalyticsFilterParams) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.scoreDistribution(filters),
    queryFn: () => analyticsApi.getScoreDistribution(filters),
    staleTime: 60 * 1000,
  });
};

export const useDiversityAnalytics = (jobId?: string) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.diversity(jobId),
    queryFn: () => analyticsApi.getDiversity({ jobId }),
    staleTime: 60 * 1000,
  });
};

export const useCandidatesReport = (filters?: AnalyticsFilterParams) => {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.reports(filters),
    queryFn: () => analyticsApi.getCandidatesReport(filters),
    staleTime: 30 * 1000,
  });
};

export const useExportReport = () => {
  return useMutation({
    mutationFn: (filters?: AnalyticsFilterParams) => analyticsApi.downloadCsvReport(filters),
  });
};
