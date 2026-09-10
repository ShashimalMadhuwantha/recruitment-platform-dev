import { z } from 'zod';
import {
  NotificationChannel,
  IntegrationProvider,
  PlanTier,
} from '@prisma/client';

export const updateAtsWeightsSchema = z.object({
  skillsWeight: z.number().min(0).max(1),
  experienceWeight: z.number().min(0).max(1),
  educationWeight: z.number().min(0).max(1),
  semanticWeight: z.number().min(0).max(1),
  certificationWeight: z.number().min(0).max(1),
}).refine(
  (data) => {
    const sum =
      data.skillsWeight +
      data.experienceWeight +
      data.educationWeight +
      data.semanticWeight +
      data.certificationWeight;
    // Account for JS floating point imprecision
    return Math.abs(sum - 1.0) < 0.001;
  },
  {
    message: 'ATS weights must sum to exactly 1.0 (100%)',
    path: ['skillsWeight'],
  }
);

export const createSkillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().optional().nullable(),
  aliases: z.array(z.string()).optional(),
});

export const updateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().optional().nullable(),
  aliases: z.array(z.string()).optional(),
});

export const createIndustrySchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateIndustrySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createLocationSchema = z.object({
  city: z.string().min(1).max(100),
  state: z.string().optional().nullable(),
  country: z.string().min(1).max(100),
  isRemoteAllowed: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateLocationSchema = z.object({
  city: z.string().min(1).max(100).optional(),
  state: z.string().optional().nullable(),
  country: z.string().min(1).max(100).optional(),
  isRemoteAllowed: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const createNotificationTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.EMAIL),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const updateNotificationTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const previewTemplateSchema = z.object({
  sampleData: z.record(z.string()).optional(),
});

export const updateIntegrationSettingSchema = z.object({
  config: z.record(z.unknown()),
  status: z.enum(['CONNECTED', 'NOT_CONFIGURED', 'ERROR']).optional(),
});

export const updateFeatureFlagSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  enabledTiers: z.array(z.nativeEnum(PlanTier)).optional(),
  isGloballyEnabled: z.boolean().optional(),
});
