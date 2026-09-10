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

const overrideScoreSchema = z.object({
  overrideScore: z.number().min(0).max(100),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export class AtsScoringController {
  /**
   * Pure in-memory preview calculation
   */
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

  /**
   * On-demand candidate pre-apply match preview (FR-ATS-02)
   */
  static async getPreApplyMatchPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      const applicantUserId = req.user!.id;
      const preview = await AtsScoringService.previewJobMatch(applicantUserId, jobId);
      return res.status(200).json({
        data: preview,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Score or re-score a specific application (FR-ATS-01)
   */
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

  /**
   * Get full persistent ATS Score Detail for an application
   */
  static async getApplicationScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const scoreDetail = await AtsScoringService.getApplicationScore(applicationId);
      return res.status(200).json({
        data: scoreDetail,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter manual score override with audit logging (FR-ATS-06, FR-ATS-10)
   */
  static async overrideApplicationScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const { overrideScore, reason } = overrideScoreSchema.parse(req.body);
      const recruiterUserId = req.user!.id;

      const updatedScore = await AtsScoringService.overrideScore({
        applicationId,
        recruiterUserId,
        overrideScore,
        reason,
      });

      return res.status(200).json({
        data: updatedScore,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch re-score all applications for a job vacancy (FR-ATS-08)
   */
  static async batchRescoreJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      const result = await AtsScoringService.batchRescoreJobApplications(jobId);
      return res.status(200).json({
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
