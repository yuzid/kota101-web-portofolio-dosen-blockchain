import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

export interface NotificationPreferences {
  enableEmail: boolean;
}

interface NotificationContextType {
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableEmail: true,
};

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
  userRoles?: string[];
}) {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  const updatePreferences = useCallback(
    (prefs: Partial<NotificationPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...prefs }));
      toast.success("Preferensi notifikasi berhasil diperbarui");
    },
    []
  );

  return (
    <NotificationContext.Provider
      value={{
        preferences,
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
