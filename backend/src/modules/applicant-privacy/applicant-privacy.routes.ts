import { Router } from 'express';
import { ApplicantPrivacyController } from './applicant-privacy.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

const router = Router();

// All applicant privacy routes require authentication and applicant/admin role
router.use(authenticateToken);
router.use(requireRole('APPLICANT', 'SUPER_ADMIN'));

// Notification Preferences (FR-AP-28)
router.get('/preferences', ApplicantPrivacyController.getPreferences);
router.put('/preferences', ApplicantPrivacyController.updatePreferences);

// Blocked Companies Management (FR-AP-30)
router.get('/blocked-companies', ApplicantPrivacyController.getBlockedCompanies);
router.post('/blocked-companies', ApplicantPrivacyController.blockCompany);
router.delete('/blocked-companies/:companyId', ApplicantPrivacyController.unblockCompany);

// GDPR Compliance: Data Portability & Right to Erasure (FR-AP-29, UC-14)
router.get('/export-data', ApplicantPrivacyController.exportPersonalData);
router.post('/erasure-request', ApplicantPrivacyController.requestAccountErasure);

export default router;
