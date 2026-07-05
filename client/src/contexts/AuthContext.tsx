// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import {
  destroyFetchInterceptor,
  initFetchInterceptor,
  isTokenExpired,
} from "../lib/api";
import { SessionWarningDialog } from "../components/ui/session-warning-dialog";
import { fetchAndCacheJenisDokumen } from "../lib/utils";

export type UserRole = "admin" | "staf_tu" | "dosen" | "kaprodi" | "kajur";

export interface User {
  id: string;
  uuid: string;
  email: string;
  name: string;
  roles: UserRole[];
  token: string;
  programStudi?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

const mapBackendUserToFrontend = (backendData: any): User => {
  const roles: UserRole[] = [];

  const dbRole = backendData.role?.toUpperCase();

  if (dbRole === "ADMIN") roles.push("admin");
  if (dbRole === "TATA_USAHA") roles.push("staf_tu");
  if (dbRole === "DOSEN") roles.push("dosen");

  if (backendData.jabatan?.is_kajur) roles.push("kajur");
  if (backendData.jabatan?.is_kaprodi) roles.push("kaprodi");

  const decoded = decodeJwtPayload(backendData.token);
  const uuid = decoded?.id || backendData.email;

  return {
    id: backendData.email,
    uuid: uuid,
    email: backendData.email,
    name: backendData.name,
    programStudi: backendData.programStudi || undefined,
    roles: roles,
    token: backendData.token,
    lastLogin: new Date().toISOString(),
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionExpiresIn, setSessionExpiresIn] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningShownRef = useRef(false);

  function getTokenExpirySeconds(): number | null {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return Math.max(0, Math.floor((payload.exp * 1000 - Date.now()) / 1000));
    } catch {
      return null;
    }
  }

  const clearAuth = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (!parsed.uuid && parsed.token) {
          const decoded = decodeJwtPayload(parsed.token);
          parsed.uuid = decoded?.id || parsed.id;
        }
        // Re-derive roles jika kosong (data user lama sebelum fitur roles ditambahkan)
        if ((!parsed.roles || parsed.roles.length === 0) && parsed.token) {
          const decoded = decodeJwtPayload(parsed.token);
          if (decoded) {
            const roles: UserRole[] = [];
            const dbRole = (decoded.role || "").toUpperCase();
            if (dbRole === "ADMIN") roles.push("admin");
            if (dbRole === "TATA_USAHA") roles.push("staf_tu");
            if (dbRole === "DOSEN") roles.push("dosen");
            if (decoded.jabatan?.is_kajur) roles.push("kajur");
            if (decoded.jabatan?.is_kaprodi) roles.push("kaprodi");
            parsed.roles = roles;
            localStorage.setItem("user", JSON.stringify(parsed));
          }
        }
        setUser(parsed);
        void fetchAndCacheJenisDokumen();
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initFetchInterceptor(() => clearAuth());
    return () => destroyFetchInterceptor();
  }, [clearAuth]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (isTokenExpired()) {
        warningShownRef.current = false;
        clearAuth();
        return;
      }

      const remaining = getTokenExpirySeconds();
      if (
        remaining !== null &&
        remaining <= 60 &&
        remaining > 0 &&
        !warningShownRef.current
      ) {
        warningShownRef.current = true;
        setSessionExpiresIn(remaining);
        setShowSessionWarning(true);
      }
    }, 10000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [clearAuth]);

  // 1. Login Manual (Form)
  const login = async (email: string, password: string) => {
    let response: Response;
    try {
      response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error(
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
      );
    }

    let result: any;
    try {
      result = await response.json();
    } catch {
      throw new Error(
        "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi."
      );
    }

    if (!response.ok || result.status === "error") {
      if (response.status === 401) {
        throw new Error("Email atau password salah.");
      }
      if (response.status === 500) {
        throw new Error(
          "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi."
        );
      }
      throw new Error(result.error || "Terjadi kesalahan. Silakan coba lagi.");
    }

    const authenticatedUser = mapBackendUserToFrontend(result.data);
    setUser(authenticatedUser);
    localStorage.setItem("user", JSON.stringify(authenticatedUser));
    localStorage.setItem("token", result.data.token);
    void fetchAndCacheJenisDokumen();
  };

  // 2. Login Menggunakan Google OAuth
  const loginWithGoogle = async (idToken: string) => {
    let response: Response;
    try {
      response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/google-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );
    } catch {
      throw new Error(
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
      );
    }

    let result: any;
    try {
      result = await response.json();
    } catch {
      throw new Error(
        "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi."
      );
    }

    if (!response.ok || result.status === "error") {
      if (response.status === 401) {
        throw new Error("Email atau password salah.");
      }
      if (response.status === 500) {
        throw new Error(
          "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi."
        );
      }
      throw new Error(result.error || "Terjadi kesalahan. Silakan coba lagi.");
    }

    const authenticatedUser = mapBackendUserToFrontend(result.data);
    setUser(authenticatedUser);
    localStorage.setItem("user", JSON.stringify(authenticatedUser));
    localStorage.setItem("token", result.data.token);
    void fetchAndCacheJenisDokumen();
  };

  const logout = () => {
    warningShownRef.current = false;
    setShowSessionWarning(false);
    clearAuth();
  };

  const handleExtendSession = () => {
    warningShownRef.current = false;
    setShowSessionWarning(false);
  };

  const handleSessionLogout = () => {
    warningShownRef.current = false;
    setShowSessionWarning(false);
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithGoogle, logout, isLoading }}
    >
      {children}
      <SessionWarningDialog
        open={showSessionWarning}
        expiresInSeconds={sessionExpiresIn}
        onExtend={handleExtendSession}
        onLogout={handleSessionLogout}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
