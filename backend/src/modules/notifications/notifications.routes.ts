import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticateToken, (_req, res) => {
  res.status(200).json({ data: [], error: null });
});

export default notificationsRouter;
