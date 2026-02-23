import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Flag to prevent multiple simultaneous token refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      resolve(api(config));
    }
  });
  failedQueue = [];
};

/**
 * Axios instance configured for the RUET Hall Management backend (Admin Panel).
 * - Sends cookies with every request (withCredentials: true)
 * - Automatically retries failed requests when accessToken expires (every 15 min)
 *   by calling /auth/renew-access-token endpoint using the refreshToken cookie
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/renew-access-token") &&
      !originalRequest.url?.includes("/auth/admin/login") &&
      !originalRequest.url?.includes("/auth/admin/register")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${API_BASE_URL}/auth/renew-access-token`,
          {},
          { withCredentials: true },
        );

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// Helper to extract error message from API responses
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
