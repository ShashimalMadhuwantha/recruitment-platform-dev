import { z } from 'zod';

export const analyticsFilterQuerySchema = z.object({
  jobId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  interval: z.enum(['day', 'week', 'month']).optional().default('day'),
});

export const exportFilterQuerySchema = z.object({
  jobId: z.string().optional(),
  stage: z.string().optional(),
  scoreBand: z.enum(['HIGH', 'MID', 'LOW']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(['csv', 'json']).optional().default('csv'),
});

export const submitDiversitySurveySchema = z.object({
  applicationId: z.string().optional(),
  companyId: z.string(),
  jobId: z.string().optional(),
  gender: z.string().max(50).optional(),
  raceEthnicity: z.string().max(100).optional(),
  veteranStatus: z.string().max(50).optional(),
  disabilityStatus: z.string().max(50).optional(),
  optedIn: z.boolean().default(true),
});

export type AnalyticsFilterQuery = z.infer<typeof analyticsFilterQuerySchema>;
export type ExportFilterQuery = z.infer<typeof exportFilterQuerySchema>;
export type SubmitDiversitySurveyInput = z.infer<typeof submitDiversitySurveySchema>;
