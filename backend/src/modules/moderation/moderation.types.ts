import { z } from 'zod';

export const ContentReportCreateSchema = z.object({
  targetType: z.enum(['JOB_POSTING', 'APPLICANT_PROFILE', 'CV']),
  targetId: z.string().uuid(),
  reason: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
});
export type ContentReportCreateInput = z.infer<typeof ContentReportCreateSchema>;

export const ContentReportResolveSchema = z.object({
  action: z.enum(['RESTORE', 'TAKEDOWN', 'FORCE_EDIT', 'WARN_USER', 'SUSPEND_PROFILE', 'DISMISS']),
  notes: z.string().min(5, 'Resolution notes are mandatory for moderator accountability').max(1000),
});
export type ContentReportResolveInput = z.infer<typeof ContentReportResolveSchema>;

export const ReportListQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  targetType: z.enum(['JOB_POSTING', 'APPLICANT_PROFILE', 'CV']).optional(),
  status: z.enum(['PENDING', 'RESOLVED', 'DISMISSED']).optional(),
  search: z.string().optional(),
});
export type ReportListQueryInput = {
  page?: number;
  limit?: number;
  targetType?: 'JOB_POSTING' | 'APPLICANT_PROFILE' | 'CV';
  status?: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  search?: string;
};

export const BannedKeywordCreateSchema = z.object({
  keyword: z.string().min(2).max(100),
  category: z.enum(['DISCRIMINATION', 'SPAM', 'OFFENSIVE', 'MISLEADING']).default('DISCRIMINATION'),
  severity: z.enum(['BLOCK', 'WARN']).default('BLOCK'),
});
export type BannedKeywordCreateInput = z.infer<typeof BannedKeywordCreateSchema>;

export const BannedKeywordTestSchema = z.object({
  text: z.string().min(1),
});
export type BannedKeywordTestInput = z.infer<typeof BannedKeywordTestSchema>;

export const AuditLogQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(15),
  action: z.string().optional(),
  actorId: z.string().optional(),
  targetType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});
export type AuditLogQueryInput = z.infer<typeof AuditLogQuerySchema>;

export const GdprRequestCreateSchema = z.object({
  requestType: z.enum(['DATA_EXPORT', 'ERASURE']),
});
export type GdprRequestCreateInput = z.infer<typeof GdprRequestCreateSchema>;

export const GdprRequestProcessSchema = z.object({
  status: z.enum(['PROCESSING', 'COMPLETED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});
export type GdprRequestProcessInput = z.infer<typeof GdprRequestProcessSchema>;
