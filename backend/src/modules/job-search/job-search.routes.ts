import { Router } from 'express';
import { JobSearchController } from './job-search.controller';
import { authenticateToken, optionalAuthenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export const jobSearchRouter = Router();
const controller = new JobSearchController();

const requireApplicantOrAdmin = requireRole('APPLICANT', 'SUPER_ADMIN');

// Public job search (with optional auth to detect saved/applied status)
jobSearchRouter.get('/', optionalAuthenticateToken, controller.searchJobs);

// Authenticated applicant: Get bookmarked jobs (defined before /:id)
jobSearchRouter.get('/saved', authenticateToken, requireApplicantOrAdmin, controller.getSavedJobs);

// Public job details
jobSearchRouter.get('/:id', optionalAuthenticateToken, controller.getJobDetails);

// Authenticated applicant: Toggle bookmark / save
jobSearchRouter.post('/:id/save', authenticateToken, requireApplicantOrAdmin, controller.toggleSaveJob);

// Authenticated applicant: Remove bookmark
jobSearchRouter.delete('/:id/save', authenticateToken, requireApplicantOrAdmin, controller.unsaveJob);

export default jobSearchRouter;
