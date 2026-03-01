"use client";

import { clearAuthData, getStoredUser, saveAuthData } from "@/lib/auth";
import {
  adminLogin,
  logout as logoutApi,
  renewAccessToken,
} from "@/lib/services/auth.service";
import type { AdminData } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  createContext,
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

/** Renew access token every 13 minutes (before the 15-minute expiry) */
const TOKEN_RENEWAL_INTERVAL = 13 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        // Immediately try to renew access token on page load
        renewAccessToken().catch(() => {});
      }
    } catch {
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync user to localStorage and manage proactive token renewal
  useEffect(() => {
    if (user) {
      saveAuthData(user);

      // Start proactive access-token renewal interval
      const intervalId = setInterval(async () => {
        try {
          await renewAccessToken();
        } catch {
          // If renewal fails, the axios interceptor will handle 401s
          // and redirect to login if the refresh token is also expired
        }
      }, TOKEN_RENEWAL_INTERVAL);

      return () => clearInterval(intervalId);
    } else {
      clearAuthData();
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const res = await adminLogin({ email, password });
    const adminData = res.data.user;
    setUser(adminData);
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Even if backend logout fails, clear local state
    }
    // Clear httpOnly cookies on the frontend domain (all paths)
    try {
      await fetch("/api/auth/clear-cookies", { method: "POST" });
    } catch {
      // Non-critical
    }
    setUser(null);
    // Hard redirect ensures middleware re-evaluates with cleared cookies
    window.location.href = "/login";
  };

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
