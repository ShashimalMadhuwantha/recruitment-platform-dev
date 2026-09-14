import { apiClient } from '../../lib/api-client';
import type {
  PublicCompanySummaryDto,
  PublicCompanyDetailDto,
  PublicCompanyJobsResponseDto,
  ToggleCompanyFollowResponseDto,
  CompanyDiscoveryQueryDto,
} from './types';

export const companyDiscoveryApi = {
  /**
   * Search and filter employer directory (FR-AP-31)
   */
  searchCompanies: async (
    query: CompanyDiscoveryQueryDto = {}
  ): Promise<{
    items: PublicCompanySummaryDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const res = await apiClient.get<{
      data: {
        items: PublicCompanySummaryDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>('/v1/companies/public', { params: query });
    return res.data.data;
  },

  /**
   * Get public employer profile (FR-AP-32)
   */
  getCompanyProfile: async (idOrSlug: string): Promise<PublicCompanyDetailDto> => {
    const res = await apiClient.get<{ data: PublicCompanyDetailDto }>(
      `/v1/companies/public/${encodeURIComponent(idOrSlug)}`
    );
    return res.data.data;
  },

  /**
   * Get company active openings with predicted match score (FR-AP-33)
   */
  getCompanyJobs: async (idOrSlug: string): Promise<PublicCompanyJobsResponseDto> => {
    const res = await apiClient.get<{ data: PublicCompanyJobsResponseDto }>(
      `/v1/companies/public/${encodeURIComponent(idOrSlug)}/jobs`
    );
    return res.data.data;
  },

  /**
   * Follow or unfollow company (FR-AP-35)
   */
  toggleCompanyFollow: async (companyId: string): Promise<ToggleCompanyFollowResponseDto> => {
    const res = await apiClient.post<{ data: ToggleCompanyFollowResponseDto }>(
      `/v1/companies/${encodeURIComponent(companyId)}/follow`
    );
    return res.data.data;
  },

  /**
   * Get list of followed employers for applicant (FR-AP-35)
   */
  getFollowedCompanies: async (
    page = 1,
    limit = 12
  ): Promise<{
    items: PublicCompanySummaryDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const res = await apiClient.get<{
      data: {
        items: PublicCompanySummaryDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>('/v1/companies/applicant/following', { params: { page, limit } });
    return res.data.data;
  },
};
