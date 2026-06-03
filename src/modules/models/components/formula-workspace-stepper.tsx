"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type FormulaWorkspaceStep =
  | "basics"
  | "parameters"
  | "mapping"
  | "studio"
  | "review";

export type FormulaWorkspaceStepConfig = {
  id: FormulaWorkspaceStep;
  label: string;
};

type FormulaWorkspaceStepperProps = {
  active: FormulaWorkspaceStep;
  onStepClick?: (step: FormulaWorkspaceStep) => void;
  completedThrough?: FormulaWorkspaceStep;
  includeMappingStep?: boolean;
  mappingLabel?: string;
  /** Override default outcome/formula steps (e.g. transformation-only wizard). */
  steps?: FormulaWorkspaceStepConfig[];
};

function resolveSteps(
  includeMappingStep: boolean,
  mappingLabel: string,
): Array<{ id: FormulaWorkspaceStep; label: string }> {
  return [
    { id: "basics", label: "Basics" },
    { id: "parameters", label: "Parameters" },
    ...(includeMappingStep ? [{ id: "mapping" as const, label: mappingLabel }] : []),
    { id: "studio", label: "Formula Studio" },
    { id: "review", label: "Review" },
  ];
}

export function FormulaWorkspaceStepper({
  active,
  onStepClick,
  completedThrough,
  includeMappingStep = false,
  mappingLabel = "Transformations",
  steps: stepsOverride,
}: FormulaWorkspaceStepperProps) {
  const steps = stepsOverride ?? resolveSteps(includeMappingStep, mappingLabel);
  const stepOrder = steps.map((step) => step.id);
  const completedIdx = completedThrough ? stepOrder.indexOf(completedThrough) : -1;
  const activeIdx = stepOrder.indexOf(active);

  return (
    <nav
      aria-label="Formula authoring steps"
      className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] pb-4"
    >
      {steps.map((step, index) => {
        const idx = stepOrder.indexOf(step.id);
        const isActive = step.id === active;
        const isComplete = idx < activeIdx || idx <= completedIdx;
        const clickable = onStepClick && idx <= Math.max(activeIdx, completedIdx + 1);

        return (
          <div key={step.id} className="flex items-center gap-2">
            {index > 0 ? (
              <span className="mx-1 hidden text-[#3f3f46] sm:inline">→</span>
            ) : null}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(step.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-500/30"
                  : isComplete
                    ? "text-emerald-200/90 hover:bg-white/[0.04]"
                    : "text-[#71717a]",
                clickable && !isActive && "hover:bg-white/[0.04] hover:text-[#d4d4d8]",
                !clickable && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[11px] font-medium",
                  isActive
                    ? "bg-cyan-500/25 text-cyan-100"
                    : isComplete
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-white/[0.06] text-[#71717a]",
                )}
              >
                {isComplete && !isActive ? <Check className="size-3.5" /> : index + 1}
              </span>
              {step.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
