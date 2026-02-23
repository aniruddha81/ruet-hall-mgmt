"use client";

import { adminLogin, logout as logoutApi } from "@/lib/services/auth.service";
import type { AdminData } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface AuthContextType {
  user: AdminData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AdminData | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "ruet_admin_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await adminLogin({ email, password });
      const adminData = res.data.user;
      setUser(adminData);
      router.push("/dashboard");
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Even if backend logout fails, clear local state
    }
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        setUser,
      }}
    >
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
