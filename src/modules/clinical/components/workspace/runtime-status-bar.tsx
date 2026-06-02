"use client";

import { Loader2 } from "lucide-react";
import type { ClinicalExecuteState } from "@/modules/clinical/hooks/use-clinical-live-execute";
import type { ClinicalAssessmentSaveState } from "@/modules/clinical/hooks/use-clinical-assessment-session";
import { cn } from "@/lib/utils";

type RuntimeStatusBarProps = {
  filledRequiredCount: number;
  requiredCount: number;
  executeState: ClinicalExecuteState;
  saveState: ClinicalAssessmentSaveState;
  missingCount: number;
  lastUpdatedLabel: string | null;
  isLocalPreview?: boolean;
};

export function RuntimeStatusBar({
  filledRequiredCount,
  requiredCount,
  executeState,
  saveState,
  missingCount,
  lastUpdatedLabel,
  isLocalPreview = false,
}: RuntimeStatusBarProps) {
  const busy = executeState === "pending" || executeState === "running";
  const complete =
    requiredCount > 0 && filledRequiredCount >= requiredCount && missingCount === 0;

  let message: string | null = null;
  if (executeState === "error") {
    message = "Calculation failed";
  } else if (busy) {
    message = "Updating…";
  } else if (missingCount > 0) {
    message = `${missingCount} required field${missingCount === 1 ? "" : "s"} left`;
  } else if (isLocalPreview) {
    message = "Not saved";
  } else if (saveState === "creating") {
    message = "Starting…";
  } else if (saveState === "saving") {
    message = "Saving…";
  } else if (saveState === "error") {
    message = "Save failed";
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500"
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono tabular-nums",
          complete ? "text-emerald-400/90" : "text-zinc-400",
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            complete ? "bg-emerald-400" : "bg-zinc-500",
          )}
          aria-hidden
        />
        {filledRequiredCount}/{requiredCount}
      </span>

      {message ? (
        <span
          className={cn(
            "inline-flex items-center gap-1",
            executeState === "error" || saveState === "error"
              ? "text-red-400/90"
              : "text-zinc-500",
          )}
        >
          {busy || saveState === "saving" ? (
            <Loader2 className="size-3 animate-spin" aria-hidden />
          ) : null}
          {message}
        </span>
      ) : null}

      {!message && lastUpdatedLabel ? (
        <span className="text-zinc-600">{lastUpdatedLabel}</span>
      ) : null}
    </div>
  );
}
