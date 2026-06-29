// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { destroyFetchInterceptor, initFetchInterceptor, isTokenExpired } from "../lib/api";

export type UserRole =
  | "admin"
  | "staf_tu"
  | "dosen"
  | "kaprodi"
  | "kajur";

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
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

const mapBackendUserToFrontend = (backendData: any): User => {
  const roles: UserRole[] = [];
  
  const dbRole = backendData.role?.toUpperCase();
  
  if (dbRole === 'ADMIN') roles.push('admin');
  if (dbRole === 'TATA_USAHA') roles.push('staf_tu');
  if (dbRole === 'DOSEN') roles.push('dosen');

  if (backendData.jabatan?.is_kajur) roles.push('kajur');
  if (backendData.jabatan?.is_kaprodi) roles.push('kaprodi');

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
    lastLogin: new Date().toISOString()
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            const dbRole = (decoded.role || '').toUpperCase();
            if (dbRole === 'ADMIN') roles.push('admin');
            if (dbRole === 'TATA_USAHA') roles.push('staf_tu');
            if (dbRole === 'DOSEN') roles.push('dosen');
            if (decoded.jabatan?.is_kajur) roles.push('kajur');
            if (decoded.jabatan?.is_kaprodi) roles.push('kaprodi');
            parsed.roles = roles;
            localStorage.setItem("user", JSON.stringify(parsed));
          }
        }
        setUser(parsed);
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
        clearAuth();
      }
    }, 30000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [clearAuth]);

  // 1. Login Manual (Form)
  const login = async (email: string, password: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok || result.status === 'error') {
      throw new Error(result.error || 'Gagal login. Silakan coba lagi.');
    }

    const authenticatedUser = mapBackendUserToFrontend(result.data);
    setUser(authenticatedUser);
    localStorage.setItem("user", JSON.stringify(authenticatedUser));
    localStorage.setItem("token", result.data.token);
  };

  // 2. Login Menggunakan Google OAuth
  const loginWithGoogle = async (idToken: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    const result = await response.json();

    if (!response.ok || result.status === 'error') {
      throw new Error(result.error || 'Otentikasi Google gagal.');
    }

    const authenticatedUser = mapBackendUserToFrontend(result.data);
    setUser(authenticatedUser);
    localStorage.setItem("user", JSON.stringify(authenticatedUser));
    localStorage.setItem("token", result.data.token);
  };

  const logout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, isLoading }}>
      {children}
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