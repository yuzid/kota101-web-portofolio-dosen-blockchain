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
  username: string;
  name: string;
  nidn?: string;
  roles: UserRole[]; // Changed from single role to array of roles
  programStudi?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    // Simulate API call - in production this would call the backend
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock authentication - replace with real API
    const mockUsers: Record<string, User> = {
      admin: {
        id: "1",
        username: "admin",
        name: "Administrator Sistem",
        roles: ["administrator"],
      },
      tu: {
        id: "2",
        username: "tu",
        name: "Admin Tata Usaha",
        roles: ["admin_tu"],
      },
      dosen: {
        id: "3",
        username: "dosen",
        name: "Dr. John Doe",
        nidn: "0412108901",
        roles: ["dosen"],
        programStudi: "D4 Teknik Informatika",
      },
      kaprodi: {
        id: "4",
        username: "kaprodi",
        name: "Dr. Jane Smith",
        nidn: "0415078801",
        roles: ["kaprodi"],
        programStudi: "D4 Teknik Informatika",
      },
      "dosen-kaprodi": {
        id: "5",
        username: "dosen-kaprodi",
        name: "Dr. Ahmad Fauzi",
        nidn: "0420059102",
        roles: ["dosen", "kaprodi"],
        programStudi: "D4 Teknik Informatika",
      },
      "dosen-kajur": {
        id: "6",
        username: "dosen-kajur",
        name: "Prof. Dr. Budi Santoso",
        nidn: "0405067801",
        roles: ["dosen", "kajur"],
        programStudi: "Jurusan Teknik Elektro",
      },
    };

    const foundUser = mockUsers[username];
    if (foundUser && password) {
      const userWithLogin = {
        ...foundUser,
        lastLogin: new Date().toISOString(),
      };
      setUser(userWithLogin);
      localStorage.setItem("user", JSON.stringify(userWithLogin));
    } else {
      throw new Error(
        "Username atau password yang Anda masukkan tidak valid. Silakan coba lagi."
      );
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
