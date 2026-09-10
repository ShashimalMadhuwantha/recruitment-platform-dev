import { Router } from 'express';
import { AtsScoringController } from './ats-scoring.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export const atsScoringRouter = Router();

// In-memory preview endpoint for algorithm validation & testing
atsScoringRouter.post('/preview', AtsScoringController.previewScore);

// Candidate Pre-Apply Match Preview (FR-ATS-02)
atsScoringRouter.get(
  '/jobs/:jobId/match-preview',
  authenticateToken,
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  AtsScoringController.getPreApplyMatchPreview
);

// Get application ATS score details
atsScoringRouter.get(
  '/applications/:applicationId/score',
  authenticateToken,
  AtsScoringController.getApplicationScore
);

// Score or re-score a specific application (FR-ATS-01)
atsScoringRouter.post(
  '/applications/:applicationId/score',
  authenticateToken,
  AtsScoringController.scoreApplication
);

// Recruiter Manual Score Override with mandatory reason & audit logging (FR-ATS-06, FR-ATS-10)
atsScoringRouter.post(
  '/applications/:applicationId/override',
  authenticateToken,
  requireRole('RECRUITER', 'SUPER_ADMIN'),
  AtsScoringController.overrideApplicationScore
);

// Batch re-scoring of all applications for a vacancy when requirements update (FR-ATS-08)
atsScoringRouter.post(
  '/jobs/:jobId/rescore',
  authenticateToken,
  requireRole('RECRUITER', 'SUPER_ADMIN'),
  AtsScoringController.batchRescoreJob
);

export default atsScoringRouter;
