import { z } from 'zod';
import { CompanyStatus, UserRole, UserStatus, PlanTier } from '@recruitment-platform/shared';

// Company Query Schema
export const companyListQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  status: z.enum(['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED'] as const).optional(),
});

export type CompanyListQueryInput = z.infer<typeof companyListQuerySchema>;

// Company Status Update Schema
export const companyStatusUpdateSchema = z.object({
  status: z.enum(['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED'] as const),
  notes: z.string().optional(),
});

export type CompanyStatusUpdateInput = z.infer<typeof companyStatusUpdateSchema>;

// Plan Assignment Schema
export const assignPlanSchema = z.object({
  planId: z.string().uuid('Invalid Plan ID format'),
});

export type AssignPlanInput = z.infer<typeof assignPlanSchema>;

// User Query Schema
export const userListQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'RECRUITER', 'APPLICANT'] as const).optional(),
  status: z.enum(['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'BANNED'] as const).optional(),
  companyId: z.string().optional(),
});

export type UserListQueryInput = z.infer<typeof userListQuerySchema>;

// User Status Update Schema
export const userStatusUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'BANNED'] as const),
  reason: z.string().min(3, 'Reason must be at least 3 characters long'),
});

export type UserStatusUpdateInput = z.infer<typeof userStatusUpdateSchema>;

// Impersonation Schema
export const impersonateUserSchema = z.object({
  reason: z.string().optional(),
});

export type ImpersonateUserInput = z.infer<typeof impersonateUserSchema>;

// Staff RBAC Update Schema
export const updateStaffRbacSchema = z.object({
  permissions: z.record(z.boolean()),
});

export type UpdateStaffRbacInput = z.infer<typeof updateStaffRbacSchema>;
