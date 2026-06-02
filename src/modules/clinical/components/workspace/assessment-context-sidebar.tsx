"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { ClinicalAssessmentSaveState } from "@/modules/clinical/hooks/use-clinical-assessment-session";
import type { ClinicalIntakeModel } from "@/types/clinical-intake";

type AssessmentContextSidebarProps = {
  model: ClinicalIntakeModel;
  saveState: ClinicalAssessmentSaveState;
  isReadOnly?: boolean;
  isLocalPreview?: boolean;
  isStarting?: boolean;
  subjectLabel: string;
  onSubjectLabelChange: (value: string) => void;
  onStartAssessment?: () => void;
  onMarkCompleted?: () => void;
};

export function AssessmentContextSidebar({
  model,
  saveState,
  isReadOnly,
  isLocalPreview,
  isStarting,
  subjectLabel,
  onSubjectLabelChange,
  onStartAssessment,
  onMarkCompleted,
}: AssessmentContextSidebarProps) {
  const busy =
    saveState === "loading" ||
    saveState === "creating" ||
    saveState === "saving" ||
    isStarting;

  return (
    <aside className="flex flex-col gap-4">
      <Link
        href="/clinical"
        className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="size-3" aria-hidden />
        All models
      </Link>

      <div>
        <h1 className="text-[15px] font-semibold leading-snug text-zinc-50">
          {model.displayName}
        </h1>
        {isReadOnly ? (
          <p className="mt-1 text-[11px] text-zinc-500">Read-only · completed</p>
        ) : isLocalPreview ? (
          <p className="mt-1 text-[11px] text-zinc-500">Preview · not saved yet</p>
        ) : null}
      </div>

      <label htmlFor="assessment-subject-label" className="block">
        <input
          id="assessment-subject-label"
          type="text"
          value={subjectLabel}
          disabled={isReadOnly}
          placeholder="Patient or visit"
          onChange={(event) => onSubjectLabelChange(event.target.value)}
          className="h-9 w-full rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 focus-visible:border-emerald-500/35 disabled:opacity-60"
        />
      </label>

      {saveState === "error" ? (
        <p className="text-[11px] text-amber-400">Could not save — try again</p>
      ) : null}

      {!isReadOnly && isLocalPreview && onStartAssessment ? (
        <button
          type="button"
          onClick={() => void onStartAssessment()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 py-2.5 text-[12px] font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : null}
          Start clinical assessment
        </button>
      ) : null}

      {!isReadOnly && !isLocalPreview && onMarkCompleted ? (
        <button
          type="button"
          onClick={() => void onMarkCompleted()}
          disabled={busy}
          className="mt-auto w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2 text-[12px] font-medium text-zinc-200 hover:bg-white/[0.06] disabled:opacity-50"
        >
          Mark complete
        </button>
      ) : null}
    </aside>
  );
}
