/**
 * Authentication utility functions for managing user session state.
 * Access and refresh tokens are managed by backend HttpOnly cookies.
 * This module only handles client-side user data (localStorage).
 */

import type { AdminData } from "./types";

const USER_STORAGE_KEY = "ruet_admin_user";

/**
 * Save user data to localStorage
 */
export function saveAuthData(user: AdminData) {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
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
 * Clear user data from localStorage
 */
export function clearAuthData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

/**
 * Check if user is authenticated (client-side only)
 */
export function isAuthenticated(): boolean {
  return !!getStoredUser();
}
