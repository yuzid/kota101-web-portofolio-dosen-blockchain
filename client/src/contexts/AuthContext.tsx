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

// Helper untuk memetakan response backend ke struktur User Frontend
const mapBackendUserToFrontend = (backendData: any): User => {
  const roles: UserRole[] = [];
  
  // Mapping base role dari database
  if (backendData.role === 'ADMIN') roles.push('administrator');
  if (backendData.role === 'TATA_USAHA') roles.push('admin_tu');
  if (backendData.role === 'DOSEN') roles.push('dosen');

  // Tambahkan role struktural aktif hasil pengecekan periode di backend
  if (backendData.jabatan?.is_kajur) roles.push('kajur');
  if (backendData.jabatan?.is_kaprodi) roles.push('kaprodi');

  return {
    id: backendData.email, // Atur sesuai dengan ID unik unik dari backend jika ada
    email: backendData.email,
    name: backendData.email.split('@')[0], // Fallback nama dari email sebelum sinkronisasi profil penuh
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