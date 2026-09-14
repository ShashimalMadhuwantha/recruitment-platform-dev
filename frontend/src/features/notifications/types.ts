import type { NotificationType } from '@recruitment-platform/shared';

export type { NotificationType };

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  payloadJson: any;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationDto[];
  total: number;
  unreadCount: number;
  limit: number;
  offset: number;
}
