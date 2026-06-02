"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { QueryErrorState } from "@/components/feedback";
import { ClinicalAssessmentRow } from "@/modules/clinical/components/clinical-assessment-row";
import { organizeRecentAssessments } from "@/modules/clinical/utils/organize-recent-assessments";
import { listClinicalAssessments } from "@/services/clinical-assessment.service";

function AssessmentList({
  items,
}: {
  items: ReturnType<typeof organizeRecentAssessments>["inProgress"];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul>
      {items.map((row, index) => (
        <li key={row.id}>
          <ClinicalAssessmentRow
            row={row}
            showDivider={index < items.length - 1}
          />
        </li>
      ))}
    </ul>
  );
}

export function ClinicalRecentAssessments() {
  const query = useQuery({
    queryKey: ["clinical-assessments", "recent"],
    queryFn: async () => (await listClinicalAssessments({ limit: 30 })).data,
  });

  const organized = useMemo(
    () => organizeRecentAssessments(query.data?.items ?? []),
    [query.data?.items],
  );

  if (query.isLoading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-zinc-500" aria-hidden />
      </div>
    );
  }

  if (query.error) {
    return (
      <QueryErrorState
        error={query.error}
        context={{ resource: "assessments" }}
        onRetry={() => query.refetch()}
        isRetrying={query.isRefetching}
      />
    );
  }

  const hasAny =
    organized.inProgress.length > 0 || organized.completed.length > 0;

  if (!hasAny) {
    return (
      <div className="py-10 text-center">
        <p className="text-[13px] text-zinc-500">No visits yet</p>
        <p className="mt-1 text-[12px] text-zinc-600">
          Start an assessment to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {organized.inProgress.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-medium text-zinc-600">Continue</p>
          <AssessmentList items={organized.inProgress} />
        </div>
      ) : null}

      {organized.completed.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-medium text-zinc-600">Recent</p>
          <AssessmentList items={organized.completed} />
        </div>
      ) : null}
    </div>
  );
}
