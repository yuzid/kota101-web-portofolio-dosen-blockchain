// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export type UserRole =
  | "administrator"
  | "admin_tu"
  | "dosen"
  | "kaprodi"
  | "kajur";

export interface User {
  id: string;
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


const mapBackendUserToFrontend = (backendData: any): User => {
  const roles: UserRole[] = [];
  
  // Normalisasi ke uppercase agar aman dari ketidaksesuaian case database
  const dbRole = backendData.role?.toUpperCase();
  
  if (dbRole === 'ADMIN') roles.push('administrator');
  if (dbRole === 'TATA_USAHA') roles.push('admin_tu');
  if (dbRole === 'DOSEN') roles.push('dosen');

  if (backendData.jabatan?.is_kajur) roles.push('kajur');
  if (backendData.jabatan?.is_kaprodi) roles.push('kaprodi');

  return {
    id: backendData.email, 
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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

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
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
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