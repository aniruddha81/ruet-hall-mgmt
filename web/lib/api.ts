import axios, { AxiosError, type AxiosInstance } from "axios";
import { clearAuthData } from "@/lib/auth";
const API_BASE_URL = "/api";
/**
 * Axios instance for the student portal.
 * Auth is an httpOnly `sessionId` cookie backed by Redis on the backend.
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status !== 401 || typeof window === "undefined") {
      return Promise.reject(error);
    }
    const url = error.config?.url ?? "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/verify-email") ||
      url.includes("/auth/resend-otp") ||
      url.includes("/auth/renew-access-token");
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }
    clearAuthData();
    try {
      await fetch("/api/auth/clear-cookies", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Best-effort
    }
    const isPublicRoute = ["/", "/login", "/signup"].some(
      (route) =>
        window.location.pathname === route ||
        (route !== "/" && window.location.pathname.startsWith(`${route}/`)),
    );
    if (!isPublicRoute) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
export default api;
/** Seconds until OTP resend is allowed (429 from /auth/resend-otp or /auth/register). */
export function getApiOtpRetryAfterSec(error: unknown): number | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) {
    return null;
  }
  const data = error.response?.data?.data;
  if (data && typeof data === "object" && "retryAfterSec" in data) {
    const sec = Number((data as { retryAfterSec: number }).retryAfterSec);
    return Number.isFinite(sec) && sec > 0 ? sec : null;
  }
  return null;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      "An unexpected error occurred"
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
/** True when login was rejected because the account already has 2 active sessions. */
export function isMaxSessionsError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) {
    return false;
  }
  const message = String(error.response?.data?.message ?? "").toLowerCase();
  return message.includes("maximum active sessions");
}
