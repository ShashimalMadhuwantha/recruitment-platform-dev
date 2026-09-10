import { Router } from 'express';
import { SystemConfigController } from './system-config.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/rbac.middleware';

const router = Router();
const controller = new SystemConfigController();

// All system configuration routes require authenticated SUPER_ADMIN role
router.use(authenticateToken, requireSuperAdmin);

// 1. ATS Weights
router.get('/ats-weights', controller.getAtsWeights);
router.put('/ats-weights', controller.updateAtsWeights);

// 2. Skills Taxonomy
router.get('/skills', controller.listSkills);
router.post('/skills', controller.createSkill);
router.put('/skills/:id', controller.updateSkill);
router.delete('/skills/:id', controller.deleteSkill);

// 3. Industries
router.get('/industries', controller.listIndustries);
router.post('/industries', controller.createIndustry);
router.put('/industries/:id', controller.updateIndustry);
router.delete('/industries/:id', controller.deleteIndustry);

// 4. Locations
router.get('/locations', controller.listLocations);
router.post('/locations', controller.createLocation);
router.put('/locations/:id', controller.updateLocation);
router.delete('/locations/:id', controller.deleteLocation);

// 5. Notification Templates
router.get('/notification-templates', controller.listNotificationTemplates);
router.get('/notification-templates/:id', controller.getNotificationTemplate);
router.post('/notification-templates', controller.createNotificationTemplate);
router.put('/notification-templates/:id', controller.updateNotificationTemplate);
router.post('/notification-templates/:id/preview', controller.previewTemplate);

// 6. Third-Party Integrations
router.get('/integrations', controller.listIntegrations);
router.put('/integrations/:provider', controller.updateIntegration);
router.post('/integrations/:provider/test', controller.testIntegration);

// 7. Feature Flags & Tier Matrix
router.get('/feature-flags', controller.listFeatureFlags);
router.put('/feature-flags/:key', controller.updateFeatureFlag);

export default router;
