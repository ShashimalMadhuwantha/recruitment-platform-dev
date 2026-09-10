import { Router } from 'express';
import { SystemConfigController } from './system-config.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin, requireRole } from '../../middleware/rbac.middleware';

const router = Router();
const controller = new SystemConfigController();

// Base authentication for all system config / taxonomy routes
router.use(authenticateToken);

// 1. ATS Weights
// Authenticated recruiters & admins can read default platform weights
router.get('/ats-weights', controller.getAtsWeights);
router.put('/ats-weights', requireSuperAdmin, controller.updateAtsWeights);

// 2. Skills Taxonomy
// Accessible to all authenticated users (Recruiters & Applicants)
router.get('/skills', controller.listSkills);
// Super admins and recruiters can add new taxonomy skills
router.post('/skills', requireRole('SUPER_ADMIN', 'RECRUITER'), controller.createSkill);
router.put('/skills/:id', requireSuperAdmin, controller.updateSkill);
router.delete('/skills/:id', requireSuperAdmin, controller.deleteSkill);

// 3. Industries
router.get('/industries', controller.listIndustries);
router.post('/industries', requireSuperAdmin, controller.createIndustry);
router.put('/industries/:id', requireSuperAdmin, controller.updateIndustry);
router.delete('/industries/:id', requireSuperAdmin, controller.deleteIndustry);

// 4. Locations
router.get('/locations', controller.listLocations);
router.post('/locations', requireSuperAdmin, controller.createLocation);
router.put('/locations/:id', requireSuperAdmin, controller.updateLocation);
router.delete('/locations/:id', requireSuperAdmin, controller.deleteLocation);

// 5. Notification Templates (Admin only)
router.get('/notification-templates', requireSuperAdmin, controller.listNotificationTemplates);
router.get('/notification-templates/:id', requireSuperAdmin, controller.getNotificationTemplate);
router.post('/notification-templates', requireSuperAdmin, controller.createNotificationTemplate);
router.put('/notification-templates/:id', requireSuperAdmin, controller.updateNotificationTemplate);
router.post('/notification-templates/:id/preview', requireSuperAdmin, controller.previewTemplate);

// 6. Third-Party Integrations (Admin only)
router.get('/integrations', requireSuperAdmin, controller.listIntegrations);
router.put('/integrations/:provider', requireSuperAdmin, controller.updateIntegration);
router.post('/integrations/:provider/test', requireSuperAdmin, controller.testIntegration);

// 7. Feature Flags & Tier Matrix (Admin only)
router.get('/feature-flags', requireSuperAdmin, controller.listFeatureFlags);
router.put('/feature-flags/:key', requireSuperAdmin, controller.updateFeatureFlag);

export default router;
