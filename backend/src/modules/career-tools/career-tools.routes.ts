import { Router } from 'express';
import { CareerToolsController } from './career-tools.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export const careerToolsRouter = Router();

careerToolsRouter.use(authenticateToken);

// Applicant CV Health Check (FR-AP-24)
careerToolsRouter.get(
  '/cv-health-check',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  CareerToolsController.runCvHealthCheck
);

// Applicant Profile Improvement Suggestions (FR-AP-23)
careerToolsRouter.get(
  '/profile-suggestions',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  CareerToolsController.getProfileSuggestions
);

export default careerToolsRouter;
