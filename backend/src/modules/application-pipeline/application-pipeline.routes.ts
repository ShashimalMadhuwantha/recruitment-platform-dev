import { Router } from 'express';
import { ApplicationController } from './application.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export const applicationPipelineRouter = Router();
const controller = new ApplicationController();

const requireApplicantOrAdmin = requireRole('APPLICANT', 'SUPER_ADMIN');
const requireRecruiterOrAdmin = requireRole('RECRUITER', 'SUPER_ADMIN');

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

// Recruiter job application pipeline list with filtering & sorting (FR-RC-10)
applicationPipelineRouter.get(
  '/jobs/:jobId',
  authenticateToken,
  requireRecruiterOrAdmin,
  controller.getJobApplications
);

// Bulk stage transition (FR-RC-14) - defined before /:id
applicationPipelineRouter.post(
  '/bulk-stage',
  authenticateToken,
  requireRecruiterOrAdmin,
  controller.bulkMoveCandidateStage
);

// Side-by-side candidate comparison (FR-RC-16) - defined before /:id
applicationPipelineRouter.post(
  '/compare',
  authenticateToken,
  requireRecruiterOrAdmin,
  controller.compareCandidates
);

// Delete candidate note (FR-RC-15) - defined before /:id
applicationPipelineRouter.delete(
  '/notes/:noteId',
  authenticateToken,
  requireRecruiterOrAdmin,
  controller.deleteCandidateNote
);

// Candidate stage movement with audit logging (FR-RC-12)
applicationPipelineRouter.patch(
  '/:id/stage',
  authenticateToken,
  requireRecruiterOrAdmin,
  controller.moveCandidateStage
);

// Add candidate internal note & rating (FR-RC-15)
applicationPipelineRouter.post(
  '/:id/notes',
  authenticateToken,
  requireRecruiterOrAdmin,
  controller.addCandidateNote
);

// Get candidate internal notes (FR-RC-15)
applicationPipelineRouter.get(
  '/:id/notes',
  authenticateToken,
  requireRecruiterOrAdmin,
  controller.getCandidateNotes
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
