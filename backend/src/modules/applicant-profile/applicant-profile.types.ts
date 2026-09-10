import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').optional(),
  phone: z.string().nullable().optional(),
  headline: z.string().max(200, 'Headline must be 200 characters or fewer').nullable().optional(),
  summary: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  visibilitySettings: z
    .object({
      visibility: z.enum(['PUBLIC', 'PRIVATE', 'ANONYMOUS']).default('PUBLIC'),
      hideFromCompanies: z.array(z.string()).optional(),
      allowRecruiterContact: z.boolean().optional(),
    })
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const experienceSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  title: z.string().min(1, 'Job title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().nullable().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().nullable().optional(),
  skillsUsedJson: z.array(z.string()).optional(),
});

export type ExperienceInput = z.infer<typeof experienceSchema>;

export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  gpa: z.union([z.number(), z.string()]).nullable().optional(),
});

export type EducationInput = z.infer<typeof educationSchema>;

export const skillSchema = z.object({
  skillId: z.string().min(1, 'Skill ID is required'),
  proficiency: z.number().int().min(1).max(5).default(3),
  yearsExperience: z.number().min(0).max(50).nullable().optional(),
});

export type SkillInput = z.infer<typeof skillSchema>;

export const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  issueDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  credentialUrl: z.string().nullable().optional(),
});

export type CertificationInput = z.infer<typeof certificationSchema>;

export const portfolioSchema = z.object({
  type: z.string().min(1, 'Portfolio type is required'),
  url: z.string().url('Must be a valid URL'),
  fileRef: z.string().nullable().optional(),
});

export type PortfolioInput = z.infer<typeof portfolioSchema>;

export const resumeUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().max(5 * 1024 * 1024, 'File size must not exceed 5MB'),
  mimeType: z.string().min(1, 'Mime type is required'),
  fileData: z.string().optional(), // base64 encoded file content or text
  versionLabel: z.string().optional().default('v1'),
  isPrimary: z.boolean().optional().default(false),
});

export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>;
