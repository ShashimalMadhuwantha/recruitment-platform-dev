import { apiClient } from '../../lib/api-client';
import type {
  JobOfferDto,
  CreateOfferDto,
  RespondOfferDto,
  HireCandidateDto,
} from './types';

export const offersApi = {
  getOfferByApplication: async (applicationId: string): Promise<JobOfferDto | null> => {
    try {
      const res = await apiClient.get<{ data: JobOfferDto }>(`/v1/offers/applications/${applicationId}`);
      return res.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  createOrUpdateOffer: async (applicationId: string, data: CreateOfferDto): Promise<JobOfferDto> => {
    const res = await apiClient.post<{ data: JobOfferDto }>(`/v1/offers/applications/${applicationId}`, data);
    return res.data.data;
  },

  sendOffer: async (offerId: string): Promise<JobOfferDto> => {
    const res = await apiClient.post<{ data: JobOfferDto }>(`/v1/offers/${offerId}/send`);
    return res.data.data;
  },

  respondOffer: async (offerId: string, data: RespondOfferDto): Promise<JobOfferDto> => {
    const res = await apiClient.post<{ data: JobOfferDto }>(`/v1/offers/${offerId}/respond`, data);
    return res.data.data;
  },

  hireCandidate: async (
    applicationId: string,
    data: HireCandidateDto
  ): Promise<{ success: boolean; message: string; requisitionClosed: boolean }> => {
    const res = await apiClient.post<{
      data: { success: boolean; message: string; requisitionClosed: boolean };
    }>(`/v1/offers/applications/${applicationId}/hire`, data);
    return res.data.data;
  },
};
