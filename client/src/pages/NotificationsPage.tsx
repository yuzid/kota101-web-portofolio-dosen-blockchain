import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { MainLayout } from '../components/layout/MainLayout';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  FileText, Users, AlertCircle, CheckCircle2, Bell,
  BellOff, Clock, Settings, Trash2, Filter, X,
  ShieldAlert, CheckCircle, Megaphone
} from 'lucide-react';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { toast } from 'sonner';

const notificationIcons: Record<string, React.ReactNode> = {
  document: <FileText className="w-5 h-5 text-blue-500" />,
  activity: <Bell className="w-5 h-5 text-green-500" />,
  conflict: <AlertCircle className="w-5 h-5 text-red-500" />,
  member_added: <Users className="w-5 h-5 text-purple-500" />,
  approval: <ShieldAlert className="w-5 h-5 text-orange-500" />,
  reminder: <CheckCircle className="w-5 h-5 text-yellow-500" />,
  system: <Megaphone className="w-5 h-5 text-gray-500" />,
};

const priorityColors: Record<string, string> = {
  high: 'text-red-600',
  medium: 'text-orange-600',
  low: 'text-gray-600',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    updatePreferences,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('semua');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by tab
    if (activeTab === 'belum-dibaca') {
      filtered = filtered.filter((n) => !n.isRead);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((n) => n.type === filterType);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter((n) => n.priority === filterPriority);
    }

    // Group by date
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((notif) => {
      const date = new Date(notif.timestamp);
      let key: string;

      if (isToday(date)) {
        key = 'Hari Ini';
      } else if (isYesterday(date)) {
        key = 'Kemarin';
      } else {
        key = format(startOfDay(date), 'dd MMMM yyyy');
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notif);
    });

    return groups;
  }, [notifications, activeTab, filterType, filterPriority]);

  const hasActiveFilters = filterType !== 'all' || filterPriority !== 'all';

  const resetFilters = () => {
    setFilterType('all');
    setFilterPriority('all');
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.relatedLink) {
      navigate(notification.relatedLink);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTargetId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    deleteNotification(deleteTargetId);
    toast.success('Notifikasi dihapus');
    setShowDeleteDialog(false);
    setDeleteTargetId(null);
  };

  const handleDeleteAll = () => {
    setShowDeleteAllDialog(true);
  };

  const confirmDeleteAll = () => {
    deleteAll();
    toast.success('Semua notifikasi dihapus');
    setShowDeleteAllDialog(false);
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} menit lalu`;
    }
    if (diffInHours < 24) {
      return `${diffInHours} jam lalu`;
    }
    if (diffInHours < 48) {
      return 'kemarin';
    }
    return format(date, 'dd MMM yyyy');
  };

  const totalFiltered = Object.values(groupedNotifications).reduce(
    (sum, group) => sum + group.length,
    0
  );

  return (
    <MainLayout
      title="Notifikasi"
      breadcrumbs={[
        { label: 'Beranda', path: '/dashboard' },
        { label: 'Notifikasi' },
      ]}
    >
      <div className="space-y-4 max-w-5xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Notifikasi</h2>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} notifikasi belum dibaca`
                : 'Semua notifikasi sudah dibaca'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Tandai Semua Dibaca
              </Button>
            )}
          </div>
        </div>

        {/* Tabs and Filters */}
        <Card>
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="semua">
                    Semua
                    <Badge variant="secondary" className="ml-2">
                      {notifications.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="belum-dibaca">
                    Belum Dibaca
                    {unreadCount > 0 && (
                      <Badge className="ml-2 bg-destructive">{unreadCount}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value="document">Dokumen</SelectItem>
                      <SelectItem value="activity">Kegiatan</SelectItem>
                      <SelectItem value="conflict">Konflik</SelectItem>
                      <SelectItem value="member_added">Anggota</SelectItem>
                      <SelectItem value="approval">Persetujuan</SelectItem>
                      <SelectItem value="reminder">Pengingat</SelectItem>
                      <SelectItem value="system">Sistem</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Prioritas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="high">Tinggi</SelectItem>
                      <SelectItem value="medium">Sedang</SelectItem>
                      <SelectItem value="low">Rendah</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      <X className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-6">
          {Object.keys(groupedNotifications).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BellOff className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {activeTab === 'belum-dibaca'
                    ? 'Tidak ada notifikasi baru'
                    : 'Tidak ada notifikasi'}
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedNotifications).map(([dateLabel, notifs]) => (
              <div key={dateLabel} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  {dateLabel}
                </h3>
                {notifs.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 border rounded-lg transition-colors group cursor-pointer ${
                      notification.isRead
                        ? 'bg-background hover:bg-accent/50'
                        : 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-900'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {notificationIcons[notification.type]}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{notification.title}</p>
                            {!notification.isRead && (
                              <Badge className="bg-green-500 h-5 px-1.5">Baru</Badge>
                            )}
                            {notification.priority === 'high' && (
                              <Badge className="bg-red-500 h-5 px-1.5">Penting</Badge>
                            )}
                            {notification.category && (
                              <Badge variant="outline" className="h-5 px-1.5 text-xs">
                                {notification.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {getTimeAgo(notification.timestamp)}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleDelete(notification.id, e)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {notification.description}
                        </p>
                        {notification.actor && (
                          <p className="text-xs text-muted-foreground">
                            {notification.actor} •{' '}
                            {format(new Date(notification.timestamp), 'EEEE, dd MMMM yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {totalFiltered > 0 && (
          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-muted-foreground">
              Menampilkan {totalFiltered} notifikasi
            </p>
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleDeleteAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Semua
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Single Notification Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Notifikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus notifikasi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Notifications Confirmation */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Notifikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus seluruh notifikasi? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAll} className="bg-destructive hover:bg-destructive/90">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pengaturan Notifikasi</DialogTitle>
            <DialogDescription>
              Atur preferensi notifikasi Anda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <Label className="text-base font-medium">Notifikasi Umum</Label>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound">Suara Notifikasi</Label>
                  <p className="text-sm text-muted-foreground">
                    Mainkan suara saat ada notifikasi baru
                  </p>
                </div>
                <Switch
                  id="sound"
                  checked={preferences.enableSound}
                  onCheckedChange={(checked) =>
                    updatePreferences({ enableSound: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="desktop">Notifikasi Desktop</Label>
                  <p className="text-sm text-muted-foreground">
                    Tampilkan notifikasi di desktop
                  </p>
                </div>
                <Switch
                  id="desktop"
                  checked={preferences.enableDesktop}
                  onCheckedChange={(checked) =>
                    updatePreferences({ enableDesktop: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email">Email Notifikasi</Label>
                  <p className="text-sm text-muted-foreground">
                    Kirim notifikasi via email
                  </p>
                </div>
                <Switch
                  id="email"
                  checked={preferences.enableEmail}
                  onCheckedChange={(checked) =>
                    updatePreferences({ enableEmail: checked })
                  }
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <Label className="text-base font-medium">Jenis Notifikasi</Label>

              <div className="flex items-center justify-between">
                <Label htmlFor="notify-document">Dokumen</Label>
                <Switch
                  id="notify-document"
                  checked={preferences.notifyOnDocument}
                  onCheckedChange={(checked) =>
                    updatePreferences({ notifyOnDocument: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notify-activity">Kegiatan</Label>
                <Switch
                  id="notify-activity"
                  checked={preferences.notifyOnActivity}
                  onCheckedChange={(checked) =>
                    updatePreferences({ notifyOnActivity: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notify-conflict">Konflik Data</Label>
                <Switch
                  id="notify-conflict"
                  checked={preferences.notifyOnConflict}
                  onCheckedChange={(checked) =>
                    updatePreferences({ notifyOnConflict: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notify-member">Anggota Ditambahkan</Label>
                <Switch
                  id="notify-member"
                  checked={preferences.notifyOnMemberAdded}
                  onCheckedChange={(checked) =>
                    updatePreferences({ notifyOnMemberAdded: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notify-approval">Persetujuan</Label>
                <Switch
                  id="notify-approval"
                  checked={preferences.notifyOnApproval}
                  onCheckedChange={(checked) =>
                    updatePreferences({ notifyOnApproval: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
