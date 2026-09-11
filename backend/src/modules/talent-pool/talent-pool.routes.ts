import { Router } from 'express';
import { talentPoolController } from './talent-pool.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export const talentPoolRouter = Router();

// Recruiter talent sourcing directory (FR-RC-11)
talentPoolRouter.get(
  '/',
  authenticateToken,
  requireRole('RECRUITER', 'SUPER_ADMIN'),
  talentPoolController.searchTalentPool
);

export default talentPoolRouter;
