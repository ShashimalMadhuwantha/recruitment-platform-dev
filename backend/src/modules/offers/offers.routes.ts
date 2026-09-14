import { Router } from 'express';
import { OffersController } from './offers.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export const offersRouter = Router();

// All offer routes require authentication
offersRouter.use(authenticateToken);

// Get application offer (Recruiter, Applicant, Admin)
offersRouter.get('/applications/:applicationId', OffersController.getApplicationOffer);

// Create / update offer draft (Recruiter, Admin)
offersRouter.post(
  '/applications/:applicationId',
  requireRole('RECRUITER', 'SUPER_ADMIN'),
  OffersController.createOrUpdateOffer
);

// Send official offer to candidate (Recruiter, Admin) - supports either applicationId or offerId
offersRouter.post(
  '/applications/:applicationId/send',
  requireRole('RECRUITER', 'SUPER_ADMIN'),
  OffersController.sendOffer
);
offersRouter.post(
  '/:offerId/send',
  requireRole('RECRUITER', 'SUPER_ADMIN'),
  OffersController.sendOffer
);

// Candidate responds to offer (Applicant) - supports both POST and PATCH
offersRouter.post(
  '/:offerId/respond',
  requireRole('APPLICANT'),
  OffersController.respondToOffer
);
offersRouter.patch(
  '/:offerId/respond',
  requireRole('APPLICANT'),
  OffersController.respondToOffer
);

// Finalize hiring & optionally close requisition (Recruiter, Admin)
offersRouter.post(
  '/applications/:applicationId/hire',
  requireRole('RECRUITER', 'SUPER_ADMIN'),
  OffersController.markCandidateHired
);

export default offersRouter;
