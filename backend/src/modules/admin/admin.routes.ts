import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireSuperAdmin } from '../../middleware/rbac.middleware';

export const adminRouter = Router();

adminRouter.use(authenticateToken, requireSuperAdmin);

adminRouter.get('/overview', (_req, res) => {
  res.status(200).json({ data: { status: 'Admin area active' }, error: null });
});

export default adminRouter;
