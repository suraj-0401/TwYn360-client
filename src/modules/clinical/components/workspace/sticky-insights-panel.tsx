"use client";

import { ClinicalOutputPanel } from "@/modules/clinical/components/clinical-output-panel";
import type { ClinicalExecuteState } from "@/modules/clinical/hooks/use-clinical-live-execute";
import type { ClinicalIntakeOutcomeOutput } from "@/types/clinical-intake";
import type { RuntimeExecutionResult } from "@/types/runtime";

type StickyInsightsPanelProps = {
  outcomes: ClinicalIntakeOutcomeOutput[];
  runtimeReadyCount: number;
  result: RuntimeExecutionResult | null;
  executeState: ClinicalExecuteState;
  executeError: string | null;
};

export function StickyInsightsPanel(props: StickyInsightsPanelProps) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-[#090b0e] p-3">
      <ClinicalOutputPanel {...props} />
    </div>
  );
}
