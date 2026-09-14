import { apiClient } from '../../lib/api-client';
import type {
  CompanyAnalyticsSummaryDto,
  CompanyFunnelResponseDto,
  CompanySourcesResponseDto,
  ApplicationVelocityResponseDto,
  AtsScoreDistributionDto,
  DiversityAnalyticsDto,
  CandidateExportResponseDto,
  AnalyticsFilterParams,
} from '@recruitment-platform/shared';

export const analyticsApi = {
  getSummary: async (params?: AnalyticsFilterParams): Promise<CompanyAnalyticsSummaryDto> => {
    const res = await apiClient.get<{ data: CompanyAnalyticsSummaryDto }>('/v1/analytics/company/summary', {
      params,
    });
    return res.data.data;
  },

  getFunnel: async (params?: AnalyticsFilterParams): Promise<CompanyFunnelResponseDto> => {
    const res = await apiClient.get<{ data: CompanyFunnelResponseDto }>('/v1/analytics/company/funnel', {
      params,
    });
    return res.data.data;
  },

  getSources: async (params?: AnalyticsFilterParams): Promise<CompanySourcesResponseDto> => {
    const res = await apiClient.get<{ data: CompanySourcesResponseDto }>('/v1/analytics/company/sources', {
      params,
    });
    return res.data.data;
  },

  getVelocity: async (params?: AnalyticsFilterParams): Promise<ApplicationVelocityResponseDto> => {
    const res = await apiClient.get<{ data: ApplicationVelocityResponseDto }>('/v1/analytics/company/velocity', {
      params,
    });
    return res.data.data;
  },

  getScoreDistribution: async (params?: AnalyticsFilterParams): Promise<AtsScoreDistributionDto> => {
    const res = await apiClient.get<{ data: AtsScoreDistributionDto }>(
      '/v1/analytics/company/score-distribution',
      {
        params,
      }
    );
    return res.data.data;
  },

  getDiversity: async (params?: { jobId?: string }): Promise<DiversityAnalyticsDto> => {
    const res = await apiClient.get<{ data: DiversityAnalyticsDto }>('/v1/analytics/company/diversity', {
      params,
    });
    return res.data.data;
  },

  getCandidatesReport: async (params?: AnalyticsFilterParams): Promise<CandidateExportResponseDto> => {
    const res = await apiClient.get<{ data: CandidateExportResponseDto }>('/v1/analytics/company/export', {
      params: { ...params, format: 'json' },
    });
    return res.data.data;
  },

  downloadCsvReport: async (params?: AnalyticsFilterParams): Promise<void> => {
    const res = await apiClient.get('/v1/analytics/company/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });

    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().substring(0, 10);
    link.setAttribute('download', `candidates-pipeline-report-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
