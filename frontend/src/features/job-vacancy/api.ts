import { apiClient } from '../../lib/api-client';
import type {
  JobVacancyDetail,
  RecruiterJobListItem,
  CreateJobVacancyDto,
  UpdateJobVacancyDto,
  JobComplianceCheckResult,
  JobStatus,
  PaginatedResult,
} from './types';

export const jobVacancyApi = {
  listJobs: async (params?: {
    search?: string;
    status?: JobStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<RecruiterJobListItem>> => {
    const res = await apiClient.get<{ data: PaginatedResult<RecruiterJobListItem> }>('/v1/job-vacancies', {
      params,
    });
    return res.data.data;
  },

  getJob: async (id: string): Promise<JobVacancyDetail> => {
    const res = await apiClient.get<{ data: JobVacancyDetail }>(`/v1/job-vacancies/${id}`);
    return res.data.data;
  },

  createJob: async (data: CreateJobVacancyDto): Promise<JobVacancyDetail> => {
    const res = await apiClient.post<{ data: JobVacancyDetail }>('/v1/job-vacancies', data);
    return res.data.data;
  },

  updateJob: async (id: string, data: UpdateJobVacancyDto): Promise<JobVacancyDetail> => {
    const res = await apiClient.put<{ data: JobVacancyDetail }>(`/v1/job-vacancies/${id}`, data);
    return res.data.data;
  },

  updateStatus: async (id: string, status: JobStatus): Promise<{ id: string; status: JobStatus }> => {
    const res = await apiClient.patch<{ data: { id: string; status: JobStatus } }>(`/v1/job-vacancies/${id}/status`, {
      status,
    });
    return res.data.data;
  },

  cloneJob: async (id: string): Promise<JobVacancyDetail> => {
    const res = await apiClient.post<{ data: JobVacancyDetail }>(`/v1/job-vacancies/${id}/clone`);
    return res.data.data;
  },

  deleteJob: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ data: { success: boolean; message: string } }>(`/v1/job-vacancies/${id}`);
    return res.data.data;
  },

  checkCompliance: async (data: { title?: string; description?: string }): Promise<JobComplianceCheckResult> => {
    const res = await apiClient.post<{ data: JobComplianceCheckResult }>('/v1/job-vacancies/check-compliance', data);
    return res.data.data;
  },
};
