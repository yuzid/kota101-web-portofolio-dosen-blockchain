import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Bell, FileText, Users, AlertCircle, CheckCircle2,
  Clock, Eye, ShieldAlert, CheckCircle, Megaphone
} from 'lucide-react';
import { format } from 'date-fns';

const notificationIcons: Record<string, React.ReactNode> = {
  document: <FileText className="w-4 h-4 text-blue-500" />,
  activity: <Bell className="w-4 h-4 text-green-500" />,
  conflict: <AlertCircle className="w-4 h-4 text-red-500" />,
  member_added: <Users className="w-4 h-4 text-purple-500" />,
  approval: <ShieldAlert className="w-4 h-4 text-orange-500" />,
  reminder: <CheckCircle className="w-4 h-4 text-yellow-500" />,
  system: <Megaphone className="w-4 h-4 text-gray-500" />,
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  // Show only recent 5 unread notifications
  const recentNotifications = notifications
    .filter((n) => !n.isRead)
    .slice(0, 5);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setOpen(false);
    if (notification.relatedLink) {
      navigate(notification.relatedLink);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m`;
    }
    if (diffInHours < 24) {
      return `${diffInHours}j`;
    }
    if (diffInHours < 48) {
      return 'kemarin';
    }
    return format(date, 'dd MMM');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifikasi</h3>
          {unreadCount > 0 && (
            <Badge className="bg-destructive">{unreadCount} baru</Badge>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Tidak ada notifikasi baru</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full text-left p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {notificationIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm line-clamp-1">
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {getTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                      {notification.priority === 'high' && (
                        <Badge className="bg-red-500 h-4 px-1 text-xs">Penting</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={handleViewAll}
          >
            <Eye className="w-4 h-4 mr-2" />
            Lihat Semua Notifikasi
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
