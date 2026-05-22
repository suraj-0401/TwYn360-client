import type { AxiosError } from "axios";
import { toast } from "@/lib/toast";
import type { ApiErrorResponse } from "@/types/api";

export type FormattedApiError = {
  title: string;
  message: string;
  status?: number;
  code?: string;
};

export type FormatApiErrorContext = {
  /** e.g. "factors", "Demo options" — used for a clearer title when loading data. */
  resource?: string;
};

export class ApiClientError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      details?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

const STATUS_TITLE: Record<number, string> = {
  400: "Invalid request",
  401: "Sign in required",
  403: "Access denied",
  404: "Not found",
  409: "Conflict",
  422: "Validation failed",
  500: "Server error",
  502: "Bad gateway",
  503: "Service unavailable",
};

const STATUS_FALLBACK_MESSAGE: Record<number, string> = {
  500: "The server encountered an error. Try again in a moment or check the API logs.",
  502: "The API gateway returned an invalid response.",
  503: "The API is temporarily unavailable.",
};

function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as AxiosError).isAxiosError === true
  );
}

function defaultTitle(status?: number, resource?: string): string {
  if (resource) {
    return `Could not load ${resource}`;
  }
  if (status && STATUS_TITLE[status]) {
    return STATUS_TITLE[status];
  }
  return "Something went wrong";
}

function parseAxiosStatusFromMessage(message: string): number | undefined {
  const match = /^Request failed with status code (\d+)$/.exec(message.trim());
  return match ? Number(match[1]) : undefined;
}

export function formatApiError(
  error: unknown,
  context?: FormatApiErrorContext,
): FormattedApiError {
  if (error instanceof ApiClientError) {
    return {
      title: defaultTitle(error.status, context?.resource),
      message: error.message || "Something went wrong",
      status: error.status,
      code: error.code,
    };
  }

  if (isAxiosError(error)) {
    const status = error.response?.status;
    const api = error.response?.data?.error;
    const title = defaultTitle(status, context?.resource);

    if (api?.message) {
      return {
        title,
        message: api.message,
        status,
        code: api.code,
      };
    }

    if (error.code === "ERR_NETWORK") {
      return {
        title: "Cannot reach API",
        message:
          "Ensure dff-service is running and NEXT_PUBLIC_API_URL is set correctly.",
      };
    }

    if (status) {
      return {
        title,
        message:
          STATUS_FALLBACK_MESSAGE[status] ??
          `The request failed (HTTP ${status}).`,
        status,
      };
    }
  }

  if (error instanceof Error) {
    const status = parseAxiosStatusFromMessage(error.message);
    if (status) {
      return formatApiError(
        new ApiClientError(
          STATUS_FALLBACK_MESSAGE[status] ??
            `The request failed (HTTP ${status}).`,
          { status },
        ),
        context,
      );
    }

    return {
      title: defaultTitle(undefined, context?.resource),
      message: error.message || "Something went wrong",
    };
  }

  return {
    title: defaultTitle(undefined, context?.resource),
    message: "Something went wrong",
  };
}

export function getErrorMessage(
  error: unknown,
  context?: FormatApiErrorContext,
): string {
  return formatApiError(error, context).message;
}

export function handleGlobalApiError(error: unknown): void {
  if (typeof window === "undefined") {
    return;
  }

  const axiosError = error as AxiosError<ApiErrorResponse> & {
    config?: { skipGlobalErrorToast?: boolean };
  };

  if (axiosError.config?.skipGlobalErrorToast) {
    return;
  }

  const formatted = formatApiError(error);

  if (axiosError.code === "ERR_NETWORK") {
    toast.error("Cannot reach server", formatted.message);
    return;
  }

  const status = axiosError.response?.status ?? formatted.status;

  if (status === 401) {
    const now = Date.now();
    if (now - lastUnauthorizedToastAt < 2500) {
      return;
    }
    lastUnauthorizedToastAt = now;
    const code = axiosError.response?.data?.error?.code;
    if (code === "UNAUTHORIZED" || code === "ADMIN_NOT_CONFIGURED") {
      toast.error("Admin API key required", formatted.message);
    } else {
      toast.error("Unauthorized", formatted.message);
    }
    return;
  }

  if (status === 403) {
    toast.error("Access denied", formatted.message);
    return;
  }

  if (status && status >= 500) {
    toast.error(formatted.title, formatted.message);
    return;
  }

  // Validation / not-found — handled inline by forms and query error states
  if (status === 400 || status === 404 || status === 409) {
    return;
  }

  if (formatted.message && formatted.message !== "Something went wrong") {
    toast.error(formatted.message);
    return;
  }

  if (error instanceof Error && error.message) {
    toast.error(error.message);
  }
}

let lastUnauthorizedToastAt = 0;
