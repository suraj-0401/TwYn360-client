import { formatAssessmentDateTime } from "@/modules/clinical/utils/format-assessment-datetime";
import type { ClinicalAssessmentSummary } from "@/types/clinical-assessment";

export type OrganizedRecentAssessments = {
  inProgress: ClinicalAssessmentSummary[];
  completed: ClinicalAssessmentSummary[];
};

function byUpdatedDesc(
  a: ClinicalAssessmentSummary,
  b: ClinicalAssessmentSummary,
): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

/** One in-progress draft per model; most recent completed visits. */
export function organizeRecentAssessments(
  items: ClinicalAssessmentSummary[],
): OrganizedRecentAssessments {
  const drafts = items
    .filter((row) => row.statusCode === "draft")
    .sort(byUpdatedDesc);
  const completed = items
    .filter((row) => row.statusCode === "completed")
    .sort(byUpdatedDesc);

  const latestDraftByModel = new Map<string, ClinicalAssessmentSummary>();
  for (const row of drafts) {
    if (!latestDraftByModel.has(row.modelId)) {
      latestDraftByModel.set(row.modelId, row);
    }
  }

  return {
    inProgress: [...latestDraftByModel.values()].slice(0, 6),
    completed: completed.slice(0, 8),
  };
}

export function assessmentListTitle(row: ClinicalAssessmentSummary): string {
  const label = row.subjectLabel?.trim();
  if (label) {
    return label;
  }
  return formatAssessmentDateTime(row.updatedAt);
}

export function assessmentListSubtitle(row: ClinicalAssessmentSummary): string {
  return row.modelDisplayName;
}
