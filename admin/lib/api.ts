import axios, { AxiosError, type AxiosInstance } from "axios";
import { clearAuthData } from "@/lib/auth";

const API_BASE_URL = "/api";

/**
 * Axios instance for the admin panel.
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
      url.includes("/auth/admin/login") ||
      url.includes("/auth/admin/register") ||
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

    const isAuthRoute = ["/login", "/signup"].some(
      (route) =>
        window.location.pathname === route ||
        window.location.pathname.startsWith(`${route}/`),
    );

    if (!isAuthRoute) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;

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

export function isMaxSessionsError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) {
    return false;
  }
  const message = String(error.response?.data?.message ?? "").toLowerCase();
  return message.includes("maximum active sessions");
}
