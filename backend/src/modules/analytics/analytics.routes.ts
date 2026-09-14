import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticateToken, optionalAuthenticateToken } from '../../middleware/auth.middleware';
import { requireRecruiter } from '../../middleware/rbac.middleware';

const router = Router();

// Recruiter Company Analytics Routes (FR-RC-21, FR-RC-22, FR-RC-23)
router.get(
  '/company/summary',
  authenticateToken,
  requireRecruiter,
  analyticsController.getSummary
);

router.get(
  '/company/funnel',
  authenticateToken,
  requireRecruiter,
  analyticsController.getFunnel
);

router.get(
  '/company/sources',
  authenticateToken,
  requireRecruiter,
  analyticsController.getSources
);

router.get(
  '/company/velocity',
  authenticateToken,
  requireRecruiter,
  analyticsController.getVelocity
);

router.get(
  '/company/score-distribution',
  authenticateToken,
  requireRecruiter,
  analyticsController.getScoreDistribution
);

router.get(
  '/company/diversity',
  authenticateToken,
  requireRecruiter,
  analyticsController.getDiversity
);

router.get(
  '/company/export',
  authenticateToken,
  requireRecruiter,
  analyticsController.exportReports
);

// Applicant voluntary Diversity Survey Submission
router.post(
  '/diversity-survey',
  optionalAuthenticateToken,
  analyticsController.submitDiversitySurvey
);

export default router;
