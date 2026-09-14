import { PrismaClient } from '@prisma/client';
import { MailService } from '../../services/mail.service';
import { config } from '../../config';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Create an in-app notification and optionally trigger email
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string | null,
    payloadJson?: any,
    sendEmailNotification: boolean = true
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
        payloadJson: payloadJson || undefined,
        isRead: false,
      },
    });

    if (sendEmailNotification) {
      // Fire-and-forget email dispatch
      setImmediate(async () => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
          });
          if (user?.email) {
            const actionUrl = link
              ? link.startsWith('http')
                ? link
                : `${config.FRONTEND_URL}${link}`
              : config.FRONTEND_URL;
            await MailService.sendNotificationEmail(
              user.email,
              `[RecruitATS] ${title}`,
              title,
              message,
              actionUrl,
              'View Notification'
            );
          }
        } catch (err) {
          console.error('Failed to send notification email:', err);
        }
      });
    }

    return notification;
  }

  /**
   * Get paginated notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
  ) {
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = options.offset && options.offset >= 0 ? options.offset : 0;

    const where = {
      userId,
      ...(options.unreadOnly ? { isRead: false } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      items,
      total,
      unreadCount,
      limit,
      offset,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}

export const notificationService = new NotificationService();
