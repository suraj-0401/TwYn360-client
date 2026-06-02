"use client";

import { useMemo } from "react";
import type { ClinicalIntakeInput } from "@/types/clinical-intake";
import { SEMAGLUTIDE_OBESITY_TEST_VALUES } from "@/modules/clinical/data/semaglutide-test-values";

type ClinicalTestValuesPanelProps = {
  modelSlug: string;
  inputs: ClinicalIntakeInput[];
  onApplyExample: (values: Record<string, unknown>) => void;
  disabled?: boolean;
};

export function ClinicalTestValuesPanel({
  modelSlug,
  inputs,
  onApplyExample,
  disabled,
}: ClinicalTestValuesPanelProps) {
  const hasExamples = useMemo(() => {
    if (modelSlug !== "semaglutide-obesity-management") {
      return false;
    }
    return inputs.some(
      (input) => SEMAGLUTIDE_OBESITY_TEST_VALUES[input.alias] !== undefined,
    );
  }, [inputs, modelSlug]);

  if (!hasExamples) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onApplyExample({ ...SEMAGLUTIDE_OBESITY_TEST_VALUES })}
      className="shrink-0 rounded-md border border-white/[0.06] px-2 py-1 text-[11px] text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 disabled:opacity-50"
    >
      Demo data
    </button>
  );
}
