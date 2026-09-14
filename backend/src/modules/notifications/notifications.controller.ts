import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notifications.service';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const unreadOnly = req.query.unreadOnly === 'true';
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const result = await notificationService.getUserNotifications(userId, {
        unreadOnly,
        limit,
        offset,
      });

      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const count = await notificationService.getUnreadCount(userId);
      return res.status(200).json({ data: { count }, error: null });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      await notificationService.markAsRead(id, userId);
      return res.status(200).json({ data: { success: true }, error: null });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      await notificationService.markAllAsRead(userId);
      return res.status(200).json({ data: { success: true }, error: null });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
