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
 * Axios instance configured for the RUET Hall Management backend.
 * - Sends cookies with every request (withCredentials: true)
 * - Automatically retries failed requests when accessToken expires
 *   by calling /auth/renew-access-token endpoint
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies (accessToken, refreshToken) with every request
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

    // If the error is 401 and we haven't already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      // Don't retry the renew-access-token endpoint itself
      !originalRequest.url?.includes("/auth/renew-access-token") &&
      // Don't retry login/register endpoints
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register")
    ) {
      if (isRefreshing) {
        // If a refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the renew-access-token endpoint
        // The refreshToken cookie is automatically sent via withCredentials
        await axios.post(
          `${API_BASE_URL}/auth/renew-access-token`,
          {},
          { withCredentials: true },
        );

        // Token refresh successful, retry all queued requests
        processQueue(null);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Token refresh failed — refreshToken is invalid/expired
        processQueue(refreshError as AxiosError);

        // Redirect to login page
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
