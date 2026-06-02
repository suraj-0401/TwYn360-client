import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchDffApi } from "@/lib/dff-server-fetch";
import { ClinicalAssessPageClient } from "@/modules/clinical/components/clinical-assess-page-client";
import type { ClinicalIntakeSchema } from "@/types/clinical-intake";

type AssessPageProps = {
  params: Promise<{ modelId: string }>;
};

export default async function ClinicalAssessPage({ params }: AssessPageProps) {
  const { modelId } = await params;

  let schema: ClinicalIntakeSchema;
  try {
    schema = await fetchDffApi<ClinicalIntakeSchema>(
      `/api/v1/models/${modelId}/clinical-intake-schema`,
    );
  } catch {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-zinc-400">Loading clinical assessment…</p>
      }
    >
      <ClinicalAssessPageClient schema={schema} />
    </Suspense>
  );
}
