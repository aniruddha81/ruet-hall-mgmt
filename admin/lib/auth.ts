/**
 * Client-side user session state (profile cache).
 * The live session is an httpOnly `sessionId` cookie backed by Redis.
 */

import type { AdminData } from "./types";

const USER_STORAGE_KEY = "ruet_admin_user";

export function saveAuthData(user: AdminData) {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
}

export function getStoredUser(): AdminData | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clearAuthData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getStoredUser();
}
