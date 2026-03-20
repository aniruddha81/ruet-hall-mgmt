/**
 * Authentication utility functions for managing auth tokens
 * Handles client-side user session state only.
 * Access and refresh tokens are managed by backend HttpOnly cookies.
 */

import type { StudentData } from "./types";

const USER_STORAGE_KEY = "ruet_student_user";

/**
 * Save user data to localStorage
 */
export function saveAuthData(user: StudentData) {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
}

/**
 * Get user data from localStorage
 */
export function getStoredUser(): StudentData | null {
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
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getStoredUser();
}
