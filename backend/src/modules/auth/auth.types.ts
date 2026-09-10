import { z } from 'zod';
import { UserRole, RecruiterSubRole, UserStatus } from '@recruitment-platform/shared';

export type { UserRole, RecruiterSubRole, UserStatus };

// Applicant Registration Schema
export const registerApplicantSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  phone: z.string().optional(),
  headline: z.string().optional(),
});

// Recruiter Registration Schema (creates tenant company)
export const registerRecruiterSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  companyName: z.string().min(2, 'Company name is required').trim(),
  companyIndustry: z.string().optional(),
  companySize: z.string().optional(),
  companyWebsite: z.string().url('Invalid website URL').optional().or(z.literal('')),
  subRole: z.enum(['COMPANY_ADMIN', 'HIRING_MANAGER', 'INTERVIEWER']).default('COMPANY_ADMIN'),
});

// General Login Schema
export const loginSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

// Token Refresh Schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Password Recovery Schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// MFA Verification Schema
export const mfaVerifySchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d+$/, 'Digits only'),
  tempToken: z.string().optional(),
});

// OAuth Callback Payload Schema
export const oauthCallbackSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  provider: z.enum(['google', 'linkedin']),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  externalId: z.string().optional(),
  role: z.enum(['APPLICANT', 'RECRUITER']).default('APPLICANT'),
  companyName: z.string().optional(),
});

// Inferred Input Types
export type RegisterApplicantInput = z.infer<typeof registerApplicantSchema>;
export type RegisterRecruiterInput = z.infer<typeof registerRecruiterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;

// Response DTOs
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mfaEnabled: boolean;
  companyId?: string | null;
  recruiterSubRole?: RecruiterSubRole | null;
  applicantProfileId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AuthSuccessResponseData {
  user: AuthenticatedUserPayload;
  tokens: AuthTokens;
  requiresMfa?: false;
}

export interface MfaRequiredResponseData {
  requiresMfa: true;
  tempToken: string;
  email: string;
}

export type LoginResponseData = AuthSuccessResponseData | MfaRequiredResponseData;
