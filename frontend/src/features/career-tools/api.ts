import { apiClient } from '../../lib/api-client';
import type {
  CvHealthCheckResultDto,
  ProfileImprovementResponseDto,
} from './types';

export const careerToolsApi = {
  runCvHealthCheck: async (): Promise<CvHealthCheckResultDto> => {
    const res = await apiClient.get<{ data: CvHealthCheckResultDto }>(
      '/v1/career-tools/cv-health-check'
    );
    return res.data.data;
  },

  getProfileImprovementSuggestions: async (): Promise<ProfileImprovementResponseDto> => {
    const res = await apiClient.get<{ data: ProfileImprovementResponseDto }>(
      '/v1/career-tools/profile-improvement'
    );
    return res.data.data;
  },
};
