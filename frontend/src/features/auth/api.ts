import { apiClient } from '../../lib/api-client';
import { ApiResponse } from '@recruitment-platform/shared';
import {
  AuthResponseData,
  RegisterApplicantPayload,
  RegisterRecruiterPayload,
} from './types';

export const authApi = {
  // Register Applicant
  registerApplicant: async (data: RegisterApplicantPayload): Promise<AuthResponseData> => {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/v1/auth/register/applicant', data);
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // Register Recruiter
  registerRecruiter: async (data: RegisterRecruiterPayload): Promise<AuthResponseData> => {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/v1/auth/register/recruiter', data);
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // Login
  login: async (credentials: { email: string; password: string }): Promise<AuthResponseData> => {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/v1/auth/login', credentials);
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // Refresh Token
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await apiClient.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>(
      '/v1/auth/refresh',
      { refreshToken }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data.tokens;
  },

  // Logout
  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post('/v1/auth/logout', { refreshToken });
  },

  // Request Password Reset
  forgotPassword: async (email: string): Promise<{ message: string; resetToken?: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string; resetToken?: string }>>(
      '/v1/auth/forgot-password',
      { email }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // Reset Password
  resetPassword: async (data: { token: string; newPassword: string }): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/v1/auth/reset-password', data);
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // MFA Verification Challenge
  verifyMfaChallenge: async (data: { tempToken: string; code: string }): Promise<AuthResponseData> => {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/v1/auth/login/mfa', data);
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data;
  },

  // Get Current User Profile
  getMe: async (): Promise<AuthResponseData['user']> => {
    const res = await apiClient.get<ApiResponse<{ user: AuthResponseData['user'] }>>('/v1/auth/me');
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.data.user;
  },
};
