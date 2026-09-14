import { Router } from 'express';
import { notificationController } from './notifications.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

export const notificationsRouter = Router();

notificationsRouter.use(authenticateToken);

notificationsRouter.get('/', (req, res, next) => notificationController.getNotifications(req, res, next));
notificationsRouter.get('/unread-count', (req, res, next) => notificationController.getUnreadCount(req, res, next));
notificationsRouter.patch('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));
notificationsRouter.post('/mark-all-read', (req, res, next) => notificationController.markAllAsRead(req, res, next));

export default notificationsRouter;
