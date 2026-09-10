import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './api';
import {
  CompanyFilterParams,
  UserFilterParams,
  UpdateCompanyStatusPayload,
  UpdateUserStatusPayload,
  AssignPlanPayload,
} from './types';
import { useAuth } from '../../app/providers';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
  });
};

export const useAdminCompanies = (params?: CompanyFilterParams) => {
  return useQuery({
    queryKey: ['admin', 'companies', params],
    queryFn: () => adminApi.getCompanies(params),
  });
};

export const useAdminCompany = (id?: string) => {
  return useQuery({
    queryKey: ['admin', 'companies', id],
    queryFn: () => (id ? adminApi.getCompanyDetails(id) : null),
    enabled: !!id,
  });
};

export const useUpdateCompanyStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCompanyStatusPayload }) =>
      adminApi.updateCompanyStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: adminApi.getPlans,
  });
};

export const useAssignCompanyPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: AssignPlanPayload }) =>
      adminApi.assignCompanyPlan(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
  });
};

export const useAdminUsers = (params?: UserFilterParams) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers(params),
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserStatusPayload }) =>
      adminApi.updateUserStatus(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useImpersonateUser = () => {
  const { login } = useAuth();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminApi.impersonateUser(userId, reason),
    onSuccess: (data) => {
      // Store backup of admin original session in sessionStorage
      const currentAccess = localStorage.getItem('access_token');
      const currentRefresh = localStorage.getItem('refresh_token');
      const currentUser = localStorage.getItem('auth_user');

      if (currentAccess && currentRefresh && currentUser) {
        sessionStorage.setItem('admin_original_access', currentAccess);
        sessionStorage.setItem('admin_original_refresh', currentRefresh);
        sessionStorage.setItem('admin_original_user', currentUser);
      }

      // Switch context to target impersonated user
      login(data.accessToken, data.accessToken, {
        ...data.user,
        mfaEnabled: data.user.mfaEnabled ?? false,
        isImpersonating: true,
        impersonatorId: data.impersonatorId,
      });
    },
  });
};
