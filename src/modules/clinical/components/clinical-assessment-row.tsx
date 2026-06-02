"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/modules/clinical/utils/format-relative-time";
import {
  assessmentListSubtitle,
  assessmentListTitle,
} from "@/modules/clinical/utils/organize-recent-assessments";
import type { ClinicalAssessmentSummary } from "@/types/clinical-assessment";
import { cn } from "@/lib/utils";

type ClinicalAssessmentRowProps = {
  row: ClinicalAssessmentSummary;
  showDivider?: boolean;
};

export function ClinicalAssessmentRow({
  row,
  showDivider = true,
}: ClinicalAssessmentRowProps) {
  const isDraft = row.statusCode === "draft";
  const updatedMs = new Date(row.updatedAt).getTime();

  return (
    <Link
      href={`/clinical/models/${row.modelId}/assess?assessmentId=${row.id}`}
      className={cn(
        "group flex items-center gap-3 py-3.5 transition-colors",
        showDivider && "border-b border-white/[0.04] last:border-0",
        "hover:bg-white/[0.02] -mx-2 rounded-lg px-2",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-zinc-100">
            {assessmentListTitle(row)}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
              isDraft
                ? "bg-amber-500/15 text-amber-200/90"
                : "bg-zinc-700/50 text-zinc-400",
            )}
          >
            {isDraft ? "Draft" : "Done"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-zinc-500">
          {assessmentListSubtitle(row)}
          <span className="text-zinc-700"> · </span>
          {formatRelativeTime(updatedMs)}
        </p>
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-zinc-600 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-zinc-400"
        aria-hidden
      />
    </Link>
  );
}
