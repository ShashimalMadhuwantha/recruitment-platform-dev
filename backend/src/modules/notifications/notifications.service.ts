import { prisma } from '../../db/client';
import { MailService } from '../../services/mail.service';
import { config } from '../../config';

const TEMPLATE_CODE_ALIASES: Record<string, string[]> = {
  JOB_OFFER_RECEIVED: ['JOB_OFFER_RECEIVED', 'OFFER_EXTENDED', 'OFFER_SENT'],
  OFFER_ACCEPTED: ['OFFER_ACCEPTED', 'OFFER_ACCEPT'],
  OFFER_DECLINED: ['OFFER_DECLINED', 'OFFER_DECLINE'],
  CANDIDATE_HIRED: ['CANDIDATE_HIRED', 'HIRED', 'APPLICANT_HIRED'],
  STAGE_CHANGE: ['APP_STAGE_UPDATE', 'STAGE_CHANGE', 'APPLICATION_STATUS_CHANGED'],
  APPLICATION_STATUS_CHANGED: ['APP_STAGE_UPDATE', 'STAGE_CHANGE', 'APPLICATION_STATUS_CHANGED'],
  INTERVIEW_SCHEDULED: ['INTERVIEW_INVITE', 'INTERVIEW_SCHEDULED'],
  INTERVIEW_INVITE: ['INTERVIEW_INVITE', 'INTERVIEW_SCHEDULED'],
};

export class NotificationService {
  /**
   * Helper: Normalize token variables to support both snake_case and camelCase placeholders
   */
  private normalizeVariables(variables: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    for (const [k, v] of Object.entries(variables)) {
      if (k === 'templateVariables') continue;
      normalized[k] = v;
      const camelKey = k.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
      normalized[camelKey] = v;
      const snakeKey = k.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      normalized[snakeKey] = v;
    }
    return normalized;
  }

  /**
   * Render an admin template with supplied variables
   */
  async renderTemplate(
    typeOrCode: string,
    variables: Record<string, any>
  ): Promise<{ subject: string; body: string; templateName: string } | null> {
    const codesToTry = TEMPLATE_CODE_ALIASES[typeOrCode] || [typeOrCode];
    const template = await prisma.notificationTemplate.findFirst({
      where: {
        code: { in: codesToTry },
        isActive: true,
      },
    });

    if (!template) {
      return null;
    }

    const normalized = this.normalizeVariables(variables);
    let renderedSubject = template.subject;
    let renderedBody = template.body;

    for (const [key, value] of Object.entries(normalized)) {
      if (value !== undefined && value !== null && typeof value !== 'object') {
        const tokenRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
        renderedSubject = renderedSubject.replace(tokenRegex, String(value));
        renderedBody = renderedBody.replace(tokenRegex, String(value));
      }
    }

    return {
      subject: renderedSubject,
      body: renderedBody,
      templateName: template.name,
    };
  }

  /**
   * Create an in-app notification and optionally trigger email using Admin Email Templates
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string | null,
    payloadJson?: any,
    sendEmailNotification: boolean = true,
    customVariables?: Record<string, string | number | null | undefined>
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

            // Collect all available token variables
            const rawVariables: Record<string, any> = {
              portal_url: actionUrl,
              portalUrl: actionUrl,
              action_url: actionUrl,
              ...(payloadJson?.templateVariables || {}),
              ...(typeof payloadJson === 'object' && payloadJson !== null ? payloadJson : {}),
              ...(customVariables || {}),
            };

            // Attempt to resolve against Admin Notification Templates
            const rendered = await this.renderTemplate(type, rawVariables);

            const emailSubject = rendered ? rendered.subject : `[RecruitATS] ${title}`;
            const emailTitle = rendered ? rendered.templateName : title;
            const emailBody = rendered ? rendered.body : message;

            await MailService.sendNotificationEmail(
              user.email,
              emailSubject,
              emailTitle,
              emailBody,
              actionUrl,
              'View in Platform'
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
