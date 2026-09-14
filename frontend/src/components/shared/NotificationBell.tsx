import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  Calendar,
  TrendingUp,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../features/notifications/hooks';
import type { NotificationType } from '../../features/notifications/types';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: notificationsData, isLoading } = useNotifications({
    unreadOnly,
    limit: 15,
  });

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif: {
    id: string;
    isRead: boolean;
    link: string | null;
  }) => {
    if (!notif.isRead) {
      await markReadMutation.mutateAsync(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      if (notif.link.startsWith('http')) {
        window.location.href = notif.link;
      } else {
        navigate(notif.link);
      }
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW_CANCELLED':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'APPLICATION_STATUS_CHANGED':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-brand-600" />;
    }
  };

  const formatTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-surface animate-in fade-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl shadow-2xl border border-border-default z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-border-default bg-surface-muted flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-[11px] font-medium text-brand-600 hover:text-brand-750 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="px-3.5 py-2 border-b border-border-default flex items-center gap-2 bg-surface text-xs">
            <button
              onClick={() => setUnreadOnly(false)}
              className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                !unreadOnly
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                unreadOnly
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Unread only
            </button>
          </div>

          {/* Notification Items List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border-default">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-text-muted">Loading notifications...</div>
            ) : !notificationsData?.items || notificationsData.items.length === 0 ? (
              <div className="py-10 text-center space-y-1.5 px-4">
                <Bell className="w-8 h-8 text-text-muted mx-auto opacity-40" />
                <p className="text-xs font-medium text-text-primary">No notifications</p>
                <p className="text-[11px] text-text-secondary">
                  {unreadOnly ? 'You have caught up on all messages.' : 'You have no notifications yet.'}
                </p>
              </div>
            ) : (
              notificationsData.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    !item.isRead ? 'bg-brand-50/40 hover:bg-brand-50/70' : 'hover:bg-surface-hover'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-surface border border-border-default shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs truncate ${
                          !item.isRead
                            ? 'font-bold text-text-primary'
                            : 'font-medium text-text-secondary'
                        }`}
                      >
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-text-muted">
                        {formatTime(item.createdAt)}
                      </span>
                      {item.link && (
                        <span className="text-[10px] text-brand-600 font-medium flex items-center gap-0.5">
                          Open <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
