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

// --------------- cookie helpers (needed by middleware) ---------------
async function setAuthCookie() {
  try {
    await fetch("/api/auth/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The cookie value is a simple presence marker; real security is
      // enforced by the backend access-token / refresh-token cookies.
      body: JSON.stringify({ token: "admin_authenticated" }),
    });
  } catch {
    // Non-critical – middleware will redirect to login if missing
  }
}

async function clearAuthCookie() {
  try {
    await fetch("/api/auth/clear-cookie", { method: "POST" });
  } catch {
    // Non-critical
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore user from localStorage on mount and re-sync the auth cookie
  // so the middleware recognises the session across page refreshes.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
        // Re-set the cookie in case it expired or was cleared
        setAuthCookie();
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
      // Set auth_token cookie so the middleware can gate protected routes
      await setAuthCookie();
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
    // Remove the auth_token cookie so middleware blocks protected routes
    await clearAuthCookie();
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
