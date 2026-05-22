import axios, { type AxiosError } from "axios";
import { env } from "@/config/env";
import { ApiClientError, handleGlobalApiError } from "@/lib/api-error";
import type { ApiErrorResponse } from "@/types/api";

/** Browser calls same-origin paths proxied by Next.js; SSR uses the API URL directly. */
function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return env.NEXT_PUBLIC_API_URL;
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

/** Attach builder admin key to mutating workspace/lookup requests when configured. */
apiClient.interceptors.request.use((config) => {
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY?.trim();
  if (adminKey && !config.headers["x-admin-key"]) {
    config.headers["x-admin-key"] = adminKey;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const apiError = error.response?.data?.error;

    handleGlobalApiError(error);

    const status = error.response?.status;

    if (apiError) {
      return Promise.reject(
        new ApiClientError(apiError.message || "API request failed", {
          status,
          code: apiError.code,
          details: apiError.details,
        }),
      );
    }

    if (error.code === "ERR_NETWORK") {
      return Promise.reject(
        new ApiClientError(
          "Cannot reach the API. Ensure dff-service is running and NEXT_PUBLIC_API_URL is correct.",
        ),
      );
    }

    if (status) {
      const fallback =
        status >= 500
          ? "Internal server error"
          : error.message || `Request failed (HTTP ${status})`;
      return Promise.reject(new ApiClientError(fallback, { status }));
    }

    return Promise.reject(
      error instanceof Error
        ? error
        : new ApiClientError("Something went wrong"),
    );
  },
);
