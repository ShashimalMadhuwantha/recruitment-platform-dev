import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.string().min(1, 'Message body cannot be empty').max(5000, 'Message cannot exceed 5000 characters'),
});

export const createInterviewSchema = z.object({
  title: z.string().min(2).max(200).optional().default('Interview'),
  interviewType: z.enum(['VIDEO', 'PHONE', 'IN_PERSON']).optional().default('VIDEO'),
  scheduledAt: z.string().datetime({ offset: true }).or(z.string()),
  durationMins: z.number().int().min(10).max(480).optional().default(45),
  timezone: z.string().optional().default('UTC'),
  videoLink: z.string().url().or(z.string()).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const updateInterviewStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  notes: z.string().optional(),
});

export const scorecardCriteriaSchema = z.object({
  technicalCompetency: z.number().min(1).max(5),
  communication: z.number().min(1).max(5),
  problemSolving: z.number().min(1).max(5),
  experienceAlignment: z.number().min(1).max(5),
  culturalFit: z.number().min(1).max(5),
  overallAverage: z.number().min(1).max(5).optional(),
});

export const submitFeedbackSchema = z.object({
  scorecard: scorecardCriteriaSchema,
  recommendation: z.enum([
    'STRONG_HIRE',
    'HIRE',
    'NEUTRAL',
    'DO_NOT_HIRE',
    'STRONG_DO_NOT_HIRE',
  ]),
  notes: z.string().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewStatusInput = z.infer<typeof updateInterviewStatusSchema>;
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
