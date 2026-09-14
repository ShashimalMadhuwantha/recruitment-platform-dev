import { apiClient } from '../../lib/api-client';
import type { NotificationListResponse, NotificationDto } from './types';

export const notificationsApi = {
  /**
   * Get user notifications (paginated, unread filter)
   */
  getNotifications: async (params?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationListResponse> => {
    const res = await apiClient.get<{ data: NotificationListResponse }>('/v1/notifications', {
      params,
    });
    return res.data.data;
  },

  /**
   * Get user unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ data: { unreadCount: number } }>(
      '/v1/notifications/unread-count'
    );
    return res.data.data.unreadCount;
  },

  /**
   * Mark single notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/v1/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/v1/notifications/read-all');
  },
};
