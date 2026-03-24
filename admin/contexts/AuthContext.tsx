"use client";

import { clearAuthData, getStoredUser, saveAuthData } from "@/lib/auth";
import { getMyProfile } from "@/lib/services/profile.service";
import {
  adminLogin,
  logout as logoutApi,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hydrate user from localStorage on mount, then validate against backend.
  // If the access token is expired, the axios 401 interceptor will
  // transparently renew it using the refresh-token cookie before the
  // getMyProfile request completes — no manual renewal call needed.
  useEffect(() => {
    (async () => {
      try {
        const storedUser = getStoredUser();
        if (!storedUser) return;

        // Show cached user immediately while we validate
        setUser(storedUser);

        // Fetch the latest profile from backend.
        // If accessToken is expired, the axios interceptor will
        // automatically renew it via refreshToken and retry this request.
        const profileRes = await getMyProfile().catch(() => null);

        if (profileRes?.data.profile) {
          setUser(profileRes.data.profile);
          return;
        }

        // Profile fetch failed even after interceptor retry — session invalid
        clearAuthData();
        setUser(null);
      } catch {
        clearAuthData();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      saveAuthData(user);
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
