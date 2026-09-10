import { apiClient } from '../../lib/api-client';
import { ApiResponse } from '@recruitment-platform/shared';
import {
  AdminPlatformStats,
  AdminCompany,
  AdminUser,
  SubscriptionPlan,
  PaginatedResult,
  CompanyFilterParams,
  UserFilterParams,
  UpdateCompanyStatusPayload,
  UpdateUserStatusPayload,
  AssignPlanPayload,
  ImpersonationResponse,
} from './types';

export const adminApi = {
  // 1. Platform Statistics
  getStats: async (): Promise<AdminPlatformStats> => {
    const res = await apiClient.get<ApiResponse<AdminPlatformStats>>('/v1/admin/stats');
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // 2. Company Management
  getCompanies: async (params?: CompanyFilterParams): Promise<PaginatedResult<AdminCompany>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<AdminCompany>>>('/v1/admin/companies', {
      params,
    });
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  getCompanyDetails: async (id: string): Promise<AdminCompany> => {
    const res = await apiClient.get<ApiResponse<AdminCompany>>(`/v1/admin/companies/${id}`);
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  updateCompanyStatus: async (
    id: string,
    payload: UpdateCompanyStatusPayload
  ): Promise<AdminCompany> => {
    const res = await apiClient.patch<ApiResponse<AdminCompany>>(`/v1/admin/companies/${id}/status`, payload);
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // 3. Subscription Plans
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/v1/admin/plans');
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  assignCompanyPlan: async (
    companyId: string,
    payload: AssignPlanPayload
  ): Promise<AdminCompany> => {
    const res = await apiClient.post<ApiResponse<AdminCompany>>(`/v1/admin/companies/${companyId}/plan`, payload);
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // 4. User Directory & Account Actions
  getUsers: async (params?: UserFilterParams): Promise<PaginatedResult<AdminUser>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<AdminUser>>>('/v1/admin/users', {
      params,
    });
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  updateUserStatus: async (
    userId: string,
    payload: UpdateUserStatusPayload
  ): Promise<AdminUser> => {
    const res = await apiClient.patch<ApiResponse<AdminUser>>(`/v1/admin/users/${userId}/status`, payload);
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // 5. Impersonation
  impersonateUser: async (
    userId: string,
    reason?: string
  ): Promise<ImpersonationResponse> => {
    const res = await apiClient.post<ApiResponse<ImpersonationResponse>>(
      `/v1/admin/impersonate/${userId}`,
      { reason }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },
};
