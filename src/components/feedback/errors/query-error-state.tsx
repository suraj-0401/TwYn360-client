"use client";

import { AlertCircle } from "lucide-react";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import {
  formatApiError,
  type FormatApiErrorContext,
} from "@/lib/api-error";

type QueryErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
  title?: string;
  /** Optional context for clearer titles (e.g. resource: "factors"). */
  context?: FormatApiErrorContext;
};

export function QueryErrorState({
  error,
  onRetry,
  isRetrying,
  title,
  context,
}: QueryErrorStateProps) {
  const formatted = formatApiError(error, context);
  const displayTitle = title ?? formatted.title;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <AlertCircle className="mb-3 size-8 text-destructive" aria-hidden />
      <p className="font-medium">{displayTitle}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {formatted.message}
      </p>
      {onRetry ? (
        <LoadingButton
          className="mt-4"
          variant="outline"
          loading={isRetrying}
          loadingText="Retrying..."
          onClick={onRetry}
        >
          Retry
        </LoadingButton>
      ) : null}
    </div>
  );
}
