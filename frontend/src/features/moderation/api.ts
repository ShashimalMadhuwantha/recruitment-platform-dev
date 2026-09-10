import { apiClient } from '../../lib/api-client';
import { ApiResponse } from '@recruitment-platform/shared';
import {
  ContentReport,
  BannedKeyword,
  GdprRequest,
  ModerationStats,
  AuditLogEntry,
  PaginatedResult,
  ReportFilterParams,
  ResolveReportPayload,
  CreateBannedKeywordPayload,
  AuditLogFilterParams,
  ProcessGdprPayload,
} from './types';

export const moderationApi = {
  // Stats
  getStats: async (): Promise<ModerationStats> => {
    const res = await apiClient.get<ApiResponse<ModerationStats>>('/v1/admin/moderation/stats');
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // Content Reports
  getReports: async (params?: ReportFilterParams): Promise<PaginatedResult<ContentReport>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<ContentReport>>>(
      '/v1/admin/moderation/reports',
      { params }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  resolveReport: async (id: string, payload: ResolveReportPayload): Promise<ContentReport> => {
    const res = await apiClient.patch<ApiResponse<ContentReport>>(
      `/v1/admin/moderation/reports/${id}/resolve`,
      payload
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // Banned Keywords
  getKeywords: async (): Promise<BannedKeyword[]> => {
    const res = await apiClient.get<ApiResponse<BannedKeyword[]>>('/v1/admin/moderation/keywords');
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  createKeyword: async (payload: CreateBannedKeywordPayload): Promise<BannedKeyword> => {
    const res = await apiClient.post<ApiResponse<BannedKeyword>>(
      '/v1/admin/moderation/keywords',
      payload
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  deleteKeyword: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      `/v1/admin/moderation/keywords/${id}`
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  testKeywords: async (text: string): Promise<{ isValid: boolean; hasBlockingViolations: boolean; violations: any[] }> => {
    const res = await apiClient.post<ApiResponse<any>>('/v1/admin/moderation/keywords/test', {
      text,
    });
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: AuditLogFilterParams): Promise<PaginatedResult<AuditLogEntry>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<AuditLogEntry>>>(
      '/v1/admin/moderation/audit-logs',
      { params }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // GDPR Requests
  getGdprRequests: async (status?: string): Promise<GdprRequest[]> => {
    const res = await apiClient.get<ApiResponse<GdprRequest[]>>('/v1/admin/moderation/gdpr/requests', {
      params: { status },
    });
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  processGdprRequest: async (id: string, payload: ProcessGdprPayload): Promise<GdprRequest> => {
    const res = await apiClient.patch<ApiResponse<GdprRequest>>(
      `/v1/admin/moderation/gdpr/requests/${id}/process`,
      payload
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },
};
