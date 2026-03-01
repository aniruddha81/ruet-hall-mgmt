/**
 * Authentication utility functions for managing auth tokens
 * Handles both client-side storage (localStorage) and server-side cookies
 */

import type { AdminData } from "./types";

const USER_STORAGE_KEY = "ruet_admin_user";
const TOKEN_STORAGE_KEY = "ruet_admin_token";

/**
 * Save user data to localStorage and set auth token cookie
 */
export function saveAuthData(user: AdminData, token?: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }

    // Middleware checks this cookie to guard dashboard routes.
    // Use backend token when available, otherwise set a session marker.
    setAuthCookie(token ?? "admin_authenticated");
  }
}

/**
 * Get user data from localStorage
 */
export function getStoredUser(): AdminData | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Get auth token from localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear all auth data from localStorage and set cookie expiry
 */
export function clearAuthData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    // Clear cookie via API route
    clearAuthCookie();
  }
}

/**
 * Set auth token as HTTP-only cookie via API route
 * This allows middleware to access the token for server-side auth checks
 */
async function setAuthCookie(token: string) {
  try {
    await fetch("/api/auth/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    console.error("Failed to set auth cookie:", error);
  }
}

/**
 * Clear auth token cookie via API route
 */
async function clearAuthCookie() {
  try {
    await fetch("/api/auth/clear-cookie", {
      method: "POST",
    });
  } catch (error) {
    console.error("Failed to clear auth cookie:", error);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const user = getStoredUser();

  // Backend auth is cookie-based; localStorage token may not exist.
  return !!user;
}
