import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyTeamApi } from './api';
import type {
  UpdateCompanyProfileDto,
  InviteTeamMemberDto,
  UpdateTeamMemberDto,
  RemoveTeamMemberDto,
  RequestPlanUpgradeDto,
} from './types';

export const useCompanyProfile = () => {
  return useQuery({
    queryKey: ['company-profile'],
    queryFn: companyTeamApi.getProfile,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateCompanyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCompanyProfileDto) => companyTeamApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
    },
  });
};

export const usePlanUsage = () => {
  return useQuery({
    queryKey: ['plan-usage'],
    queryFn: companyTeamApi.getPlanUsage,
    staleTime: 60 * 1000,
  });
};

export const useRequestPlanUpgrade = () => {
  return useMutation({
    mutationFn: (data: RequestPlanUpgradeDto) => companyTeamApi.requestPlanUpgrade(data),
  });
};

export const useTeamDirectory = () => {
  return useQuery({
    queryKey: ['team-directory'],
    queryFn: companyTeamApi.listTeamDirectory,
    staleTime: 30 * 1000,
  });
};

export const useInviteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteTeamMemberDto) => companyTeamApi.inviteMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-directory'] });
      queryClient.invalidateQueries({ queryKey: ['plan-usage'] });
    },
  });
};

export const useRevokeInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyTeamApi.revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-directory'] });
      queryClient.invalidateQueries({ queryKey: ['plan-usage'] });
    },
  });
};

export const useResendInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyTeamApi.resendInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-directory'] });
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamMemberDto }) =>
      companyTeamApi.updateMemberRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-directory'] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: RemoveTeamMemberDto }) =>
      companyTeamApi.removeMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-directory'] });
      queryClient.invalidateQueries({ queryKey: ['plan-usage'] });
    },
  });
};
