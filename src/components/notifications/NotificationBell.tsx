'use client';

import { useRouter } from 'next/navigation';
import { Bell, Calendar, Users, Settings, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useNotifications from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { Notification, NotificationType } from '@/types/database';

function getNotificationIcon(type: NotificationType) {
  if (type.startsWith('appointment.')) return Calendar;
  if (type.startsWith('staff.') || type.startsWith('practitioner.')) return Users;
  return Settings;
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string, actionUrl: string | null) => void;
}) {
  const Icon = getNotificationIcon(notification.type);
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <button
      onClick={() => onRead(notification.id, notification.action_url)}
      className={`w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
        notification.is_read ? 'opacity-60' : ''
      }`}
    >
      <div className={`mt-0.5 rounded-full p-1.5 ${notification.is_read ? 'bg-muted' : 'bg-primary/10'}`}>
        <Icon className={`h-3.5 w-3.5 ${notification.is_read ? 'text-muted-foreground' : 'text-primary'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${notification.is_read ? 'font-normal' : 'font-medium'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
      {!notification.is_read && (
        <div className="mt-2 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </button>
  );
}

export default function NotificationBell() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleNotificationClick = async (id: string, actionUrl: string | null) => {
    await markAsRead(id);
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {displayCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleNotificationClick}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
