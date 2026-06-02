"use client";

import { useSearchParams } from "next/navigation";
import { ClinicalAssessmentWorkspace } from "@/modules/clinical/components/clinical-assessment-workspace";
import type { ClinicalIntakeSchema } from "@/types/clinical-intake";

type ClinicalAssessPageClientProps = {
  schema: ClinicalIntakeSchema;
};

export function ClinicalAssessPageClient({ schema }: ClinicalAssessPageClientProps) {
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");

  return (
    <ClinicalAssessmentWorkspace
      schema={schema}
      initialAssessmentId={assessmentId}
    />
  );
}
