import { z } from 'zod';

export const updateNotificationPreferencesSchema = z.object({
  applicationStatusEmail: z.boolean().optional(),
  applicationStatusInApp: z.boolean().optional(),
  interviewInvitesEmail: z.boolean().optional(),
  interviewInvitesInApp: z.boolean().optional(),
  messagesEmail: z.boolean().optional(),
  messagesInApp: z.boolean().optional(),
  followedCompanyJobEmail: z.boolean().optional(),
  followedCompanyJobInApp: z.boolean().optional(),
  jobAlertsEmail: z.boolean().optional(),
  jobAlertsInApp: z.boolean().optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

export const blockCompanySchema = z.object({
  companyId: z.string().uuid('Company ID must be a valid UUID'),
  reason: z.string().max(500).optional(),
});

export type BlockCompanyInput = z.infer<typeof blockCompanySchema>;

export const requestAccountErasureSchema = z.object({
  password: z.string().min(1, 'Password confirmation is required to request erasure'),
  reason: z.string().max(1000).optional(),
  confirmAcknowledgment: z.boolean().refine((val) => val === true, {
    message: 'You must confirm acknowledgment that erasure is irreversible',
  }),
});

export type RequestAccountErasureInput = z.infer<typeof requestAccountErasureSchema>;
