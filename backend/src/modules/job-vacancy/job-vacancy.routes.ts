import { Router } from 'express';
import { JobVacancyController } from './job-vacancy.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRecruiter } from '../../middleware/rbac.middleware';

export const jobVacancyRouter = Router();
const controller = new JobVacancyController();

// All recruiter job vacancy routes require authenticated recruiter (or super admin)
jobVacancyRouter.use(authenticateToken, requireRecruiter);

// Compliance check endpoint
jobVacancyRouter.post('/check-compliance', controller.checkCompliance);

// Vacancy CRUD & Lifecycle
jobVacancyRouter.get('/', controller.listJobs);
jobVacancyRouter.post('/', controller.createJob);
jobVacancyRouter.get('/:id', controller.getJob);
jobVacancyRouter.put('/:id', controller.updateJob);
jobVacancyRouter.patch('/:id/status', controller.updateStatus);
jobVacancyRouter.post('/:id/clone', controller.cloneJob);
jobVacancyRouter.delete('/:id', controller.deleteJob);

export default jobVacancyRouter;
