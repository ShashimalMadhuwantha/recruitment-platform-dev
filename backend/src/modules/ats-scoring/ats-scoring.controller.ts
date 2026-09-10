import { Request, Response, NextFunction } from 'express';
import { AtsScoringService } from './ats-scoring.service';
import { z } from 'zod';

const scorePreviewSchema = z.object({
  applicant: z.object({
    skills: z.array(
      z.object({
        name: z.string(),
        proficiency: z.number().default(3),
        years: z.number().default(1),
      })
    ),
    totalExperienceYears: z.number().default(0),
    pastJobTitles: z.array(z.string()).default([]),
    educationLevel: z.string().default('None'),
    fieldOfStudy: z.string().optional(),
    certifications: z.array(z.string()).default([]),
    rawCvText: z.string().optional(),
  }),
  job: z.object({
    jobTitle: z.string(),
    jobDescriptionText: z.string(),
    requiredSkills: z.array(
      z.object({
        name: z.string(),
        priority: z.enum(['MUST_HAVE', 'NICE_TO_HAVE']).default('MUST_HAVE'),
        weight: z.number().default(1.0),
        minProficiency: z.number().default(3),
      })
    ),
    minExperienceYears: z.number().default(0),
    maxExperienceYears: z.number().optional(),
    requiredEducationLevel: z.string().optional(),
    requiredCertifications: z.array(z.string()).optional(),
  }),
});

export class AtsScoringController {
  static async previewScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicant, job } = scorePreviewSchema.parse(req.body);
      const breakdown = AtsScoringService.calculateScore(applicant, job);
      return res.status(200).json({
        data: breakdown,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  static async scoreApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const breakdown = await AtsScoringService.scoreApplication(applicationId);
      return res.status(200).json({
        data: breakdown,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
