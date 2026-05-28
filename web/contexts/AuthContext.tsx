"use client";

import { clearAuthData, getStoredUser, saveAuthData } from "@/lib/auth";
import { getMyProfile } from "@/lib/services/profile.service";
import {
  logout as logoutApi,
  studentLogin,
} from "@/lib/services/auth.service";
import type { StudentData } from "@/lib/types";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface LoginOptions {
  /** Revoke all other live sessions, then sign in (2-device limit recovery). */
  force?: boolean;
}

interface AuthContextType {
  user: StudentData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, options?: LoginOptions) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: StudentData | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Hydrate user from localStorage on mount, then validate against backend.
  // Skip API validation on `/` so a stale cookie does not redirect to login.
  useEffect(() => {
    (async () => {
      try {
        const storedUser = getStoredUser();
        if (!storedUser) return;

        setUser(storedUser);

        if (pathname === "/") {
          return;
        }

        const profileRes = await getMyProfile().catch(() => null);

        if (profileRes?.data.profile) {
          setUser(profileRes.data.profile);
          return;
        }

        clearAuthData();
        setUser(null);
      } catch {
        clearAuthData();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [pathname]);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      saveAuthData(user);
    } else {
      clearAuthData();
    }
  }, [user]);

  const login = async (
    email: string,
    password: string,
    options?: LoginOptions,
  ) => {
    const res = await studentLogin({
      email,
      password,
      force: options?.force,
    });
    const studentData = res.data.student_data;
    setUser(studentData);
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
