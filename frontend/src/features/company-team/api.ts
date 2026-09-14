import { apiClient } from '../../lib/api-client';
import type {
  CompanyProfileDto,
  UpdateCompanyProfileDto,
  TeamDirectoryResponseDto,
  TeamInvitationDto,
  TeamMemberDto,
  InviteTeamMemberDto,
  UpdateTeamMemberDto,
  RemoveTeamMemberDto,
  AcceptInvitationDto,
  VerifyInvitationResponseDto,
  PlanUsageDto,
  RequestPlanUpgradeDto,
} from './types';

export const companyTeamApi = {
  // Company Profile & Branding
  getProfile: async (): Promise<CompanyProfileDto> => {
    const res = await apiClient.get<{ data: CompanyProfileDto }>('/v1/company/profile');
    return res.data.data;
  },

  updateProfile: async (data: UpdateCompanyProfileDto): Promise<CompanyProfileDto> => {
    const res = await apiClient.patch<{ data: CompanyProfileDto }>('/v1/company/profile', data);
    return res.data.data;
  },

  // Plan Quotas & Upgrade Requests
  getPlanUsage: async (): Promise<PlanUsageDto> => {
    const res = await apiClient.get<{ data: PlanUsageDto }>('/v1/company/plan-usage');
    return res.data.data;
  },

  requestPlanUpgrade: async (data: RequestPlanUpgradeDto): Promise<{ message: string }> => {
    const res = await apiClient.post<{ data: { message: string } }>('/v1/company/request-upgrade', data);
    return res.data.data;
  },

  // Team Directory & Invitations
  listTeamDirectory: async (): Promise<TeamDirectoryResponseDto> => {
    const res = await apiClient.get<{ data: TeamDirectoryResponseDto }>('/v1/team');
    return res.data.data;
  },

  inviteMember: async (data: InviteTeamMemberDto): Promise<TeamInvitationDto> => {
    const res = await apiClient.post<{ data: TeamInvitationDto }>('/v1/team/invite', data);
    return res.data.data;
  },

  revokeInvitation: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ data: { message: string } }>(`/v1/team/invite/${id}`);
    return res.data.data;
  },

  resendInvitation: async (id: string): Promise<TeamInvitationDto> => {
    const res = await apiClient.post<{ data: TeamInvitationDto }>(`/v1/team/invite/${id}/resend`);
    return res.data.data;
  },

  verifyInvitationToken: async (token: string): Promise<VerifyInvitationResponseDto> => {
    const res = await apiClient.get<{ data: VerifyInvitationResponseDto }>('/v1/team/invite/verify', {
      params: { token },
    });
    return res.data.data;
  },

  acceptInvitation: async (data: AcceptInvitationDto): Promise<{ user: any; token: string; message: string }> => {
    const res = await apiClient.post<{ data: { user: any; token: string; message: string } }>('/v1/team/accept-invite', data);
    return res.data.data;
  },

  updateMemberRole: async (id: string, data: UpdateTeamMemberDto): Promise<TeamMemberDto> => {
    const res = await apiClient.patch<{ data: TeamMemberDto }>(`/v1/team/members/${id}`, data);
    return res.data.data;
  },

  removeMember: async (id: string, data?: RemoveTeamMemberDto): Promise<{ message: string; reassignedJobsCount: number }> => {
    const res = await apiClient.delete<{ data: { message: string; reassignedJobsCount: number } }>(
      `/v1/team/members/${id}`,
      { data }
    );
    return res.data.data;
  },
};
