import { Router } from 'express';
import { ModerationController } from './moderation.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// -------------------------------------------------------------
// Authenticated User Accessible Endpoints (Reporting & GDPR self-service)
// -------------------------------------------------------------
router.post('/reports', authenticateToken, ModerationController.createReport);
router.post('/gdpr/requests', authenticateToken, ModerationController.createGdprRequest);

// -------------------------------------------------------------
// Super Admin Protected Moderation & Compliance Endpoints
// -------------------------------------------------------------
router.use(authenticateToken, requireSuperAdmin);

// Dashboard Metrics
router.get('/stats', ModerationController.getStats);

// Content Moderation Queues (Flagged Jobs & Reported Profiles)
router.get('/reports', ModerationController.listReports);
router.patch('/reports/:id/resolve', ModerationController.resolveReport);

// Banned Keywords Dictionary & Scanner
router.get('/keywords', ModerationController.listBannedKeywords);
router.post('/keywords', ModerationController.createBannedKeyword);
router.delete('/keywords/:id', ModerationController.deleteBannedKeyword);
router.post('/keywords/test', ModerationController.testKeywords);

// Platform Audit Log System
router.get('/audit-logs', ModerationController.listAuditLogs);

// GDPR Compliance Management
router.get('/gdpr/requests', ModerationController.listGdprRequests);
router.patch('/gdpr/requests/:id/process', ModerationController.processGdprRequest);

export { router as moderationRoutes };
export default router;
