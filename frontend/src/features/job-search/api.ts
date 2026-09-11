import { apiClient } from '../../lib/api-client';
import type {
  JobSearchFilters,
  PublicJobListItem,
  PublicJobDetailDto,
  SavedJobDto,
} from '@recruitment-platform/shared';

export interface PaginatedJobSearchResult {
  items: PublicJobListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const jobSearchApi = {
  searchJobs: async (filters?: JobSearchFilters): Promise<PaginatedJobSearchResult> => {
    const res = await apiClient.get<{ data: PaginatedJobSearchResult }>('/v1/jobs', {
      params: filters,
    });
    return res.data.data;
  },

  getJobDetails: async (id: string): Promise<PublicJobDetailDto> => {
    const res = await apiClient.get<{ data: PublicJobDetailDto }>(`/v1/jobs/${id}`);
    return res.data.data;
  },

  toggleSaveJob: async (id: string): Promise<{ isSaved: boolean; message: string }> => {
    const res = await apiClient.post<{ data: { isSaved: boolean; message: string } }>(`/v1/jobs/${id}/save`);
    return res.data.data;
  },

  unsaveJob: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ data: { success: boolean; message: string } }>(`/v1/jobs/${id}/save`);
    return res.data.data;
  },

  getSavedJobs: async (): Promise<SavedJobDto[]> => {
    const res = await apiClient.get<{ data: SavedJobDto[] }>('/v1/jobs/saved');
    return res.data.data;
  },
};
