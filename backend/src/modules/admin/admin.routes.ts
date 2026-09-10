import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/rbac.middleware';

export const adminRouter = Router();

// Super Admin authorization guard for all admin routes
adminRouter.use(authenticateToken, requireSuperAdmin);

// Platform Overview & KPIs
adminRouter.get('/stats', AdminController.getStats);
adminRouter.get('/overview', AdminController.getStats); // alias

// Company Management (FR-SA-01)
adminRouter.get('/companies', AdminController.listCompanies);
adminRouter.get('/companies/:id', AdminController.getCompany);
adminRouter.patch('/companies/:id/status', AdminController.updateCompanyStatus);
adminRouter.post('/companies/:id/plan', AdminController.assignPlan);

// Subscription Plans (FR-SA-02)
adminRouter.get('/plans', AdminController.listPlans);

// User Directory & Account Suspension (FR-SA-04, FR-SA-05)
adminRouter.get('/users', AdminController.listUsers);
adminRouter.patch('/users/:id/status', AdminController.updateUserStatus);

// Impersonation (FR-SA-03)
adminRouter.post('/impersonate/:userId', AdminController.impersonateUser);

// Audit Logs (FR-SA-12)
adminRouter.get('/audit-logs', AdminController.listAuditLogs);

export default adminRouter;
