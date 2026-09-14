import { Router } from 'express';
import { CompanyDiscoveryController } from './company-discovery.controller';
import { authenticateToken, optionalAuthenticateToken } from '../../middleware/auth.middleware';
import { requireApplicant } from '../../middleware/rbac.middleware';

export const companyDiscoveryRouter = Router();

// -------------------------------------------------------------
// Public & Applicant Company Discovery Routes (/api/v1/companies)
// -------------------------------------------------------------

// Public directory search with optional user auth (for personalized follow states)
companyDiscoveryRouter.get(
  '/public',
  optionalAuthenticateToken,
  CompanyDiscoveryController.searchCompanies
);

// Public employer profile with optional user auth
companyDiscoveryRouter.get(
  '/public/:idOrSlug',
  optionalAuthenticateToken,
  CompanyDiscoveryController.getCompanyProfile
);

// Public active openings catalog with predicted ATS scores for authenticated applicants
companyDiscoveryRouter.get(
  '/public/:idOrSlug/jobs',
  optionalAuthenticateToken,
  CompanyDiscoveryController.getCompanyJobs
);

// Toggle follow/unfollow company (Applicant only)
companyDiscoveryRouter.post(
  '/:id/follow',
  authenticateToken,
  requireApplicant,
  CompanyDiscoveryController.toggleFollow
);

// Get followed companies for authenticated applicant
companyDiscoveryRouter.get(
  '/applicant/following',
  authenticateToken,
  requireApplicant,
  CompanyDiscoveryController.getFollowedCompanies
);

export default companyDiscoveryRouter;
