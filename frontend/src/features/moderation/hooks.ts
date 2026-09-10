import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moderationApi } from './api';
import {
  ReportFilterParams,
  ResolveReportPayload,
  CreateBannedKeywordPayload,
  AuditLogFilterParams,
  ProcessGdprPayload,
} from './types';

export const useModerationStats = () => {
  return useQuery({
    queryKey: ['moderation', 'stats'],
    queryFn: moderationApi.getStats,
  });
};

export const useContentReports = (params?: ReportFilterParams) => {
  return useQuery({
    queryKey: ['moderation', 'reports', params],
    queryFn: () => moderationApi.getReports(params),
  });
};

export const useResolveReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResolveReportPayload }) =>
      moderationApi.resolveReport(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['moderation', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['moderation', 'audit-logs'] });
    },
  });
};

export const useBannedKeywords = () => {
  return useQuery({
    queryKey: ['moderation', 'keywords'],
    queryFn: moderationApi.getKeywords,
  });
};

export const useCreateBannedKeyword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBannedKeywordPayload) => moderationApi.createKeyword(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'keywords'] });
      queryClient.invalidateQueries({ queryKey: ['moderation', 'stats'] });
    },
  });
};

export const useDeleteBannedKeyword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moderationApi.deleteKeyword(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'keywords'] });
      queryClient.invalidateQueries({ queryKey: ['moderation', 'stats'] });
    },
  });
};

export const useTestKeywords = () => {
  return useMutation({
    mutationFn: (text: string) => moderationApi.testKeywords(text),
  });
};

export const useAuditLogs = (params?: AuditLogFilterParams) => {
  return useQuery({
    queryKey: ['moderation', 'audit-logs', params],
    queryFn: () => moderationApi.getAuditLogs(params),
  });
};

export const useGdprRequests = (status?: string) => {
  return useQuery({
    queryKey: ['moderation', 'gdpr-requests', status],
    queryFn: () => moderationApi.getGdprRequests(status),
  });
};

export const useProcessGdprRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProcessGdprPayload }) =>
      moderationApi.processGdprRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'gdpr-requests'] });
      queryClient.invalidateQueries({ queryKey: ['moderation', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['moderation', 'audit-logs'] });
    },
  });
};
