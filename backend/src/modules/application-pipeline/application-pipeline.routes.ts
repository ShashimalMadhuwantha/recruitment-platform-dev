import { Router } from 'express';
import { ApplicationController } from './application.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export const applicationPipelineRouter = Router();
const controller = new ApplicationController();

const requireApplicantOrAdmin = requireRole('APPLICANT', 'SUPER_ADMIN');

// Candidate application submission (FR-AP-19)
applicationPipelineRouter.post(
  '/',
  authenticateToken,
  requireApplicantOrAdmin,
  controller.submitApplication
);

// Candidate application dashboard list (FR-AP-21)
applicationPipelineRouter.get(
  '/my-applications',
  authenticateToken,
  requireApplicantOrAdmin,
  controller.getMyApplications
);

// Recruiter job application pipeline list
applicationPipelineRouter.get(
  '/jobs/:jobId',
  authenticateToken,
  requireRole('RECRUITER', 'SUPER_ADMIN'),
  controller.getJobApplications
);

// View application detail
applicationPipelineRouter.get(
  '/:id',
  authenticateToken,
  controller.getApplicationById
);

// Candidate application withdrawal (FR-AP-20)
applicationPipelineRouter.post(
  '/:id/withdraw',
  authenticateToken,
  requireApplicantOrAdmin,
  controller.withdrawApplication
);

export default applicationPipelineRouter;
