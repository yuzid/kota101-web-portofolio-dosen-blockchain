import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type:
    | "document"
    | "activity"
    | "conflict"
    | "member_added"
    | "approval"
    | "reminder"
    | "system";
  title: string;
  description: string;
  actor?: string;
  timestamp: string;
  isRead: boolean;
  relatedLink?: string;
  priority: "low" | "medium" | "high";
  category?: string;
}

export interface NotificationPreferences {
  enableSound: boolean;
  enableDesktop: boolean;
  enableEmail: boolean;
  notifyOnDocument: boolean;
  notifyOnActivity: boolean;
  notifyOnConflict: boolean;
  notifyOnMemberAdded: boolean;
  notifyOnApproval: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "isRead">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  deleteAll: () => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableSound: true,
  enableDesktop: false,
  enableEmail: true,
  notifyOnDocument: true,
  notifyOnActivity: true,
  notifyOnConflict: true,
  notifyOnMemberAdded: true,
  notifyOnApproval: true,
};

// Mock notifications based on role
const getMockNotifications = (role: string): Notification[] => {
  const baseNotifications: Record<string, Notification[]> = {
    dosen: [
      {
        id: "1",
        type: "document",
        title: "Dokumen Baru Didistribusikan",
        description:
          'Admin TU Siti Aminah telah mendistribusikan dokumen "SK Mengajar Semester Genap 2025/2026" kepada Anda.',
        actor: "Admin TU Siti Aminah",
        timestamp: "2026-05-16T09:15:00",
        isRead: false,
        relatedLink: "/documents",
        priority: "high",
        category: "Dokumen",
      },
      {
        id: "2",
        type: "member_added",
        title: "Undangan Kegiatan — Perlu Konfirmasi",
        description:
          'Dr. Ahmad Fauzi mengundang Anda sebagai anggota pada kegiatan "Penelitian Blockchain dalam Pendidikan". Konfirmasi keterlibatan Anda.',
        actor: "Dr. Ahmad Fauzi",
        timestamp: "2026-05-15T14:30:00",
        isRead: false,
        relatedLink: "/activities/2",
        priority: "high",
        category: "Kegiatan",
      },
      {
        id: "6",
        type: "member_added",
        title: "Undangan Kegiatan Baru",
        description:
          'Dr. Siti Nurhaliza mengundang Anda pada kegiatan "Pengabdian Masyarakat Desa Cikoneng". Silakan konfirmasi.',
        actor: "Dr. Siti Nurhaliza",
        timestamp: "2026-06-08T09:00:00",
        isRead: false,
        relatedLink: "/activities/6",
        priority: "high",
        category: "Kegiatan",
      },
      {
        id: "3",
        type: "activity",
        title: "Kegiatan Diperbarui",
        description:
          'Data kegiatan "Mata Kuliah Pemrograman Web" telah diperbarui oleh Dr. Ahmad Fauzi (anggota).',
        actor: "Dr. Ahmad Fauzi",
        timestamp: "2026-05-15T10:20:00",
        isRead: true,
        relatedLink: "/activities/1",
        priority: "low",
        category: "Kegiatan",
      },
      {
        id: "4",
        type: "conflict",
        title: "Konflik Data Terdeteksi",
        description:
          'Terjadi konflik data pada kegiatan "Pengabdian Masyarakat Desa Cikoneng" — selesaikan sebelum dapat mengedit.',
        timestamp: "2026-05-14T16:45:00",
        isRead: true,
        relatedLink: "/activities/3",
        priority: "high",
        category: "Sistem",
      },
      {
        id: "5",
        type: "reminder",
        title: "Deadline Pengumpulan Laporan",
        description:
          'Batas waktu pengumpulan laporan kegiatan penelitian "AI in Education" adalah 3 hari lagi.',
        timestamp: "2026-05-14T08:00:00",
        isRead: false,
        relatedLink: "/activities/4",
        priority: "high",
        category: "Pengingat",
      },
    ],
    staf_tu: [
      {
        id: "10",
        type: "document",
        title: "Dokumen Berhasil Didistribusikan",
        description:
          'Dokumen "SK Mengajar Semester Genap 2025/2026" berhasil didistribusikan ke 25 dosen.',
        timestamp: "2026-05-16T09:15:00",
        isRead: false,
        relatedLink: "/document-distribution",
        priority: "medium",
        category: "Dokumen",
      },
      {
        id: "11",
        type: "system",
        title: "Dokumen Tercatat di Blockchain",
        description:
          'Dokumen "Surat Tugas Penelitian Q2" berhasil tercatat di blockchain dengan hash 0x7f8a...',
        timestamp: "2026-05-13T11:05:00",
        isRead: true,
        relatedLink: "/document-distribution",
        priority: "low",
        category: "Blockchain",
      },
    ],
    kaprodi: [
      {
        id: "20",
        type: "activity",
        title: "Kegiatan Baru Ditambahkan",
        description:
          'Dr. John Doe menambahkan kegiatan "Mata Kuliah Pemrograman Web" (Pendidikan - D4 TI).',
        actor: "Dr. John Doe",
        timestamp: "2026-05-16T10:30:00",
        isRead: false,
        relatedLink: "/ami-recap",
        priority: "medium",
        category: "Kegiatan",
      },
      {
        id: "21",
        type: "activity",
        title: "Kegiatan Penelitian Diperbarui",
        description:
          'Dr. Ahmad Fauzi memperbarui kegiatan "Penelitian Blockchain" (Penelitian - D4 TI).',
        actor: "Dr. Ahmad Fauzi",
        timestamp: "2026-05-15T14:00:00",
        isRead: true,
        relatedLink: "/ami-recap",
        priority: "low",
        category: "Kegiatan",
      },
      {
        id: "22",
        type: "approval",
        title: "Menunggu Persetujuan",
        description:
          'Kegiatan "Workshop AI untuk Mahasiswa" membutuhkan persetujuan Anda.',
        actor: "Dr. Siti Nurhaliza",
        timestamp: "2026-05-14T09:00:00",
        isRead: false,
        relatedLink: "/ami-recap",
        priority: "high",
        category: "Persetujuan",
      },
    ],
    kajur: [
      {
        id: "30",
        type: "activity",
        title: "Kegiatan Baru Ditambahkan",
        description:
          'Dr. Siti Nurhaliza menambahkan kegiatan "Pengabdian Masyarakat" (Pengabdian - D3 TI).',
        actor: "Dr. Siti Nurhaliza",
        timestamp: "2026-05-16T11:00:00",
        isRead: false,
        relatedLink: "/ami-recap",
        priority: "medium",
        category: "Kegiatan",
      },
    ],
  };

  return baseNotifications[role] || [];
};

export function NotificationProvider({
  children,
  userRoles,
}: {
  children: ReactNode;
  userRoles?: string[];
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // Initialize notifications based on user roles
  useEffect(() => {
    if (userRoles && userRoles.length > 0) {
      // Merge notifications from all roles
      const allNotifs = userRoles.flatMap((role) => getMockNotifications(role));
      // Remove duplicates by id and sort by timestamp
      const uniqueNotifs = Array.from(
        new Map(allNotifs.map((n) => [n.id, n])).values()
      ).sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setNotifications(uniqueNotifs);
    }
  }, [userRoles?.join(",")]);

  // Request desktop notification permission
  useEffect(() => {
    if (preferences.enableDesktop && "Notification" in window) {
      Notification.requestPermission();
    }
  }, [preferences.enableDesktop]);

  const playNotificationSound = useCallback(() => {
    if (preferences.enableSound) {
      // In production, play actual notification sound
      // const audio = new Audio('/notification-sound.mp3');
      // audio.play().catch(() => {});
    }
  }, [preferences.enableSound]);

  const showDesktopNotification = useCallback(
    (notification: Notification) => {
      if (
        preferences.enableDesktop &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(notification.title, {
          body: notification.description,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
      }
    },
    [preferences.enableDesktop]
  );

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "isRead">) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      // Check if notification type is enabled in preferences
      const typeEnabled = {
        document: preferences.notifyOnDocument,
        activity: preferences.notifyOnActivity,
        conflict: preferences.notifyOnConflict,
        member_added: preferences.notifyOnMemberAdded,
        approval: preferences.notifyOnApproval,
        reminder: true,
        system: true,
      }[notification.type];

      if (!typeEnabled) return;

      setNotifications((prev) => [newNotification, ...prev]);

      // Show toast for high priority
      if (notification.priority === "high") {
        toast.info(notification.title, {
          description: notification.description,
        });
      }

      playNotificationSound();
      showDesktopNotification(newNotification);
    },
    [preferences, playNotificationSound, showDesktopNotification]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const deleteAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback(
    (prefs: Partial<NotificationPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...prefs }));
      toast.success("Preferensi notifikasi berhasil diperbarui");
    },
    []
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAll,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}
