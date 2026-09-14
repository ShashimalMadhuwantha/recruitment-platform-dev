import { z } from 'zod';
import { EmploymentType, JobStatus, SkillPriority } from '@prisma/client';

export const screeningQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(3),
  type: z.enum(['YES_NO', 'TEXT', 'MULTIPLE_CHOICE']),
  options: z.array(z.string()).optional(),
  isKnockout: z.boolean().default(false),
  requiredAnswer: z.string().optional(),
});

export const requiredSkillItemSchema = z.object({
  skillId: z.string(),
  priority: z.nativeEnum(SkillPriority).default(SkillPriority.MUST_HAVE),
  weight: z.number().min(0).max(5).default(1.0),
  minProficiency: z.number().int().min(1).max(5).default(3),
});

export const jobRequirementSchema = z.object({
  minExperienceYears: z.number().min(0).max(50).optional().nullable(),
  maxExperienceYears: z.number().min(0).max(50).optional().nullable(),
  educationLevel: z.string().optional().nullable(),
  requiredCertifications: z.array(z.string()).optional().nullable(),
});

export const atsWeightOverridesSchema = z.object({
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
    return Math.abs(sum - 1.0) < 0.001;
  },
  {
    message: 'ATS weights must sum to exactly 1.0 (100%)',
    path: ['skillsWeight'],
  }
);

export const createJobVacancySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  requirementsSummary: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.FULL_TIME),
  salaryMin: z.number().min(0).optional().nullable(),
  salaryMax: z.number().min(0).optional().nullable(),
  deadline: z.string().datetime({ offset: true }).or(z.string()).optional().nullable(),
  status: z.nativeEnum(JobStatus).default(JobStatus.DRAFT),
  requirements: jobRequirementSchema.optional().nullable(),
  requiredSkills: z.array(requiredSkillItemSchema).optional(),
  screeningQuestions: z.array(screeningQuestionSchema).optional(),
  atsWeightOverrides: atsWeightOverridesSchema.optional().nullable(),
});

export const updateJobVacancySchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  requirementsSummary: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  salaryMin: z.number().min(0).optional().nullable(),
  salaryMax: z.number().min(0).optional().nullable(),
  deadline: z.string().datetime({ offset: true }).or(z.string()).optional().nullable(),
  status: z.nativeEnum(JobStatus).optional(),
  requirements: jobRequirementSchema.optional().nullable(),
  requiredSkills: z.array(requiredSkillItemSchema).optional(),
  screeningQuestions: z.array(screeningQuestionSchema).optional(),
  atsWeightOverrides: atsWeightOverridesSchema.optional().nullable(),
});

export const updateJobStatusSchema = z.object({
  status: z.nativeEnum(JobStatus),
});

export const complianceCheckSchema = z.object({
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
  requirementsSummary: z.string().optional().default(''),
});
