import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from './api';

export const NOTIFICATIONS_KEYS = {
  all: ['notifications'] as const,
  list: (params?: { unreadOnly?: boolean; limit?: number; offset?: number }) =>
    [...NOTIFICATIONS_KEYS.all, 'list', params] as const,
  unreadCount: () => [...NOTIFICATIONS_KEYS.all, 'unread-count'] as const,
};

export const useNotifications = (params?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: NOTIFICATIONS_KEYS.list(params),
    queryFn: () => notificationsApi.getNotifications(params),
  });
};

export const useUnreadNotificationCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: NOTIFICATIONS_KEYS.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled,
    refetchInterval: 20000, // Polling every 20 seconds
    refetchOnWindowFocus: true,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
    },
  });
};
