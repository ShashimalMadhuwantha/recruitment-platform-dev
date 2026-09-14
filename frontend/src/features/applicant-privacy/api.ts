import { apiClient } from '../../lib/api-client';
import type {
  NotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
  BlockedCompanyDto,
  BlockCompanyInputDto,
  GdprExportDataDto,
  RequestAccountErasureDto,
  GdprErasureResponseDto,
} from './types';

export const applicantPrivacyApi = {
  /**
   * FR-AP-28: Fetch notification preferences
   */
  getPreferences: async (): Promise<NotificationPreferenceDto> => {
    const res = await apiClient.get<{ data: NotificationPreferenceDto }>(
      '/v1/applicant/privacy/preferences'
    );
    return res.data.data;
  },

  /**
   * FR-AP-28: Update notification preferences
   */
  updatePreferences: async (
    data: UpdateNotificationPreferenceDto
  ): Promise<NotificationPreferenceDto> => {
    const res = await apiClient.put<{ data: NotificationPreferenceDto }>(
      '/v1/applicant/privacy/preferences',
      data
    );
    return res.data.data;
  },

  /**
   * FR-AP-30: Get list of blocked companies
   */
  getBlockedCompanies: async (): Promise<BlockedCompanyDto[]> => {
    const res = await apiClient.get<{ data: BlockedCompanyDto[] }>(
      '/v1/applicant/privacy/blocked-companies'
    );
    return res.data.data;
  },

  /**
   * FR-AP-30: Block a company
   */
  blockCompany: async (input: BlockCompanyInputDto): Promise<BlockedCompanyDto> => {
    const res = await apiClient.post<{ data: BlockedCompanyDto }>(
      '/v1/applicant/privacy/blocked-companies',
      input
    );
    return res.data.data;
  },

  /**
   * FR-AP-30: Unblock a company
   */
  unblockCompany: async (companyId: string): Promise<{ success: boolean; companyId: string }> => {
    const res = await apiClient.delete<{ data: { success: boolean; companyId: string } }>(
      `/v1/applicant/privacy/blocked-companies/${encodeURIComponent(companyId)}`
    );
    return res.data.data;
  },

  /**
   * FR-AP-29: Export personal data archive (GDPR Data Portability)
   */
  exportPersonalData: async (): Promise<GdprExportDataDto> => {
    const res = await apiClient.get<{ data: GdprExportDataDto }>(
      '/v1/applicant/privacy/export-data'
    );
    return res.data.data;
  },

  /**
   * FR-AP-29, UC-14: Request account deletion / erasure
   */
  requestAccountErasure: async (
    input: RequestAccountErasureDto
  ): Promise<GdprErasureResponseDto> => {
    const res = await apiClient.post<{ data: GdprErasureResponseDto }>(
      '/v1/applicant/privacy/erasure-request',
      input
    );
    return res.data.data;
  },
};
