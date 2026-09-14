import { z } from 'zod';
import { RecruiterSubRole, PlanTier } from '@recruitment-platform/shared';

// Location item schema
export const companyLocationSchema = z.object({
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  address: z.string().optional(),
  isHq: z.boolean().optional(),
});

// Culture media item schema
export const cultureMediaItemSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO']),
  url: z.string().url('Must be a valid media URL'),
  caption: z.string().optional(),
});

// Social links schema
export const companySocialLinksSchema = z.object({
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  glassdoor: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
});

// Recruiter permissions schema
export const recruiterPermissionsSchema = z.object({
  canCreateJobs: z.boolean().optional(),
  canEditJobs: z.boolean().optional(),
  canDeleteJobs: z.boolean().optional(),
  canViewCandidateSalary: z.boolean().optional(),
  canAdvancePipeline: z.boolean().optional(),
  canScheduleInterviews: z.boolean().optional(),
  canSubmitScorecards: z.boolean().optional(),
  canExtendOffers: z.boolean().optional(),
  canManageTeam: z.boolean().optional(),
  canViewAnalytics: z.boolean().optional(),
  canManageCompanyProfile: z.boolean().optional(),
});

// Update company profile schema
export const updateCompanyProfileSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100).optional(),
  industry: z.string().max(100).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal('')),
  coverPhotoUrl: z.string().url().optional().nullable().or(z.literal('')),
  website: z.string().url().optional().nullable().or(z.literal('')),
  description: z.string().max(3000).optional().nullable(),
  locations: z.array(companyLocationSchema).optional(),
  cultureMedia: z.array(cultureMediaItemSchema).optional(),
  socialLinks: companySocialLinksSchema.optional(),
});

// Invite team member schema
export const inviteTeamMemberSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase(),
  subRole: z.enum(['COMPANY_ADMIN', 'HIRING_MANAGER', 'INTERVIEWER'] as const),
  department: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  permissions: recruiterPermissionsSchema.optional(),
});

// Update team member role/permissions schema
export const updateTeamMemberSchema = z.object({
  subRole: z.enum(['COMPANY_ADMIN', 'HIRING_MANAGER', 'INTERVIEWER'] as const).optional(),
  department: z.string().max(100).optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  permissions: recruiterPermissionsSchema.optional().nullable(),
});

// Remove team member schema
export const removeTeamMemberSchema = z.object({
  transferRequisitionsToUserId: z.string().uuid().optional(),
});

// Accept invitation schema
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

// Request plan upgrade schema
export const requestPlanUpgradeSchema = z.object({
  requestedTier: z.enum(['PRO', 'ENTERPRISE'] as const),
  note: z.string().max(500).optional(),
});

export type UpdateCompanyProfileInput = z.infer<typeof updateCompanyProfileSchema>;
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type RemoveTeamMemberInput = z.infer<typeof removeTeamMemberSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type RequestPlanUpgradeInput = z.infer<typeof requestPlanUpgradeSchema>;
