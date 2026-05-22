"use client";

import { useEffect } from "react";
import { QueryErrorState } from "@/components/feedback";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <QueryErrorState
        error={error}
        title="Something went wrong"
        onRetry={reset}
      />
    </div>
  );
}
