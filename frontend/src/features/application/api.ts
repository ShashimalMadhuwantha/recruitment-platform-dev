import { apiClient } from '../../lib/api-client';
import type {
  SubmitApplicationDto,
  ApplicantApplicationListItem,
} from '@recruitment-platform/shared';

export interface SubmitApplicationResponse {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  status: string;
  knockoutFailed: boolean;
  overallScore?: number | null;
  scoreBand?: string | null;
  message: string;
}

export interface WithdrawApplicationResponse {
  success: boolean;
  applicationId: string;
  status: string;
  withdrawnAt?: string;
  message: string;
}

export const applicationApi = {
  submitApplication: async (dto: SubmitApplicationDto): Promise<SubmitApplicationResponse> => {
    const res = await apiClient.post<{ data: SubmitApplicationResponse }>('/v1/applications', dto);
    return res.data.data;
  },

  getMyApplications: async (): Promise<ApplicantApplicationListItem[]> => {
    const res = await apiClient.get<{ data: ApplicantApplicationListItem[] }>('/v1/applications/my-applications');
    return res.data.data;
  },

  getApplicationDetails: async (id: string): Promise<any> => {
    const res = await apiClient.get<{ data: any }>(`/v1/applications/${id}`);
    return res.data.data;
  },

  withdrawApplication: async (id: string, reason?: string): Promise<WithdrawApplicationResponse> => {
    const res = await apiClient.post<{ data: WithdrawApplicationResponse }>(`/v1/applications/${id}/withdraw`, {
      reason,
    });
    return res.data.data;
  },

  getJobApplications: async (jobId: string): Promise<any[]> => {
    const res = await apiClient.get<{ data: any[] }>(`/v1/applications/jobs/${jobId}`);
    return res.data.data;
  },
};
