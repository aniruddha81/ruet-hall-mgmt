"use client";

import { clearAuthData, getStoredUser, saveAuthData } from "@/lib/auth";
import { logout as logoutApi, studentLogin } from "@/lib/services/auth.service";
import type { StudentData } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface AuthContextType {
  user: StudentData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: StudentData | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch {
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
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
    const res = await studentLogin({ email, password });
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
    setUser(null);
    router.push("/login");
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
