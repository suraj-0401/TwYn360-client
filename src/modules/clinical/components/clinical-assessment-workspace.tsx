"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { ClinicalShell } from "@/components/layout/clinical-shell";
import { ClinicalIntakeForm } from "@/modules/clinical/components/clinical-intake-form";
import { ClinicalTestValuesPanel } from "@/modules/clinical/components/clinical-test-values-panel";
import { AssessmentContextSidebar } from "@/modules/clinical/components/workspace/assessment-context-sidebar";
import { ClinicalWorkspaceLayout } from "@/modules/clinical/components/workspace/clinical-workspace-layout";
import { RuntimeStatusBar } from "@/modules/clinical/components/workspace/runtime-status-bar";
import { StickyInsightsPanel } from "@/modules/clinical/components/workspace/sticky-insights-panel";
import { useClinicalAssessmentSession } from "@/modules/clinical/hooks/use-clinical-assessment-session";
import { useClinicalLiveExecute } from "@/modules/clinical/hooks/use-clinical-live-execute";
import { formatRelativeTime } from "@/modules/clinical/utils/format-relative-time";
import type { ClinicalIntakeSchema } from "@/types/clinical-intake";

type ClinicalAssessmentWorkspaceProps = {
  schema: ClinicalIntakeSchema;
  initialAssessmentId?: string | null;
};

function defaultValuesFromSchema(
  schema: ClinicalIntakeSchema,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const input of schema.inputs) {
    if (input.defaultValue !== null && input.defaultValue !== undefined) {
      next[input.alias] = input.defaultValue;
    }
  }
  return next;
}

export function ClinicalAssessmentWorkspace({
  schema,
  initialAssessmentId,
}: ClinicalAssessmentWorkspaceProps) {
  const modelId = schema.model.id;
  const {
    assessment,
    saveState,
    isLoading,
    hasLoadError,
    loadError,
    isReadOnly,
    isLocalPreview,
    startAssessment,
    queueSave,
    persistLastResult,
    markCompleted,
    retryBootstrap,
  } = useClinicalAssessmentSession({ modelId, initialAssessmentId });

  const [values, setValues] = useState(() => defaultValuesFromSchema(schema));
  const [subjectLabel, setSubjectLabel] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!assessment) {
      return;
    }
    setValues({
      ...defaultValuesFromSchema(schema),
      ...assessment.inputs,
    });
    setSubjectLabel(assessment.subjectLabel ?? "");
  }, [assessment?.id, schema]);

  const executeEnabled = !isReadOnly && schema.runtimeReadyCount > 0;

  const {
    result: executionResult,
    executeState,
    executeError,
    missingLabels,
    lastUpdatedAt,
  } = useClinicalLiveExecute({
    modelId,
    inputs: schema.inputs,
    values,
    enabled: executeEnabled,
    initialResult: assessment?.lastResult ?? null,
    onResult: (result) => {
      void persistLastResult(result);
    },
  });

  useEffect(() => {
    if (!lastUpdatedAt) {
      return;
    }
    const timer = window.setInterval(() => setNowMs(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, [lastUpdatedAt]);

  const runtimeInputCount = useMemo(
    () => schema.inputs.filter((row) => row.runtimeRequired).length,
    [schema.inputs],
  );

  const filledRequiredCount = Math.max(
    0,
    runtimeInputCount - missingLabels.length,
  );

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return null;
    }
    return formatRelativeTime(lastUpdatedAt, nowMs);
  }, [lastUpdatedAt, nowMs]);

  const persistSnapshot = (next: {
    inputs: Record<string, unknown>;
    subjectLabel: string;
  }) => {
    queueSave({
      inputs: next.inputs,
      subjectLabel: next.subjectLabel.trim() || null,
    });
  };

  const handleValuesChange = (next: Record<string, unknown>) => {
    setValues(next);
    persistSnapshot({ inputs: next, subjectLabel });
  };

  const handleSubjectLabelChange = (next: string) => {
    setSubjectLabel(next);
    persistSnapshot({ inputs: values, subjectLabel: next });
  };

  const handleStartAssessment = async () => {
    await startAssessment({
      inputs: values,
      subjectLabel: subjectLabel.trim() || null,
    });
  };

  const handleApplyDemo = (next: Record<string, unknown>) => {
    const merged = { ...values, ...next };
    setValues(merged);
    persistSnapshot({ inputs: merged, subjectLabel });
  };

  if (isLoading) {
    return (
      <ClinicalShell hideHeader>
        <p className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading assessment…
        </p>
      </ClinicalShell>
    );
  }

  if (hasLoadError) {
    return (
      <ClinicalShell hideHeader>
        <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
          <p className="text-amber-200/90">
            Could not load this assessment.
            {loadError ? ` ${loadError}` : null}
          </p>
          <button
            type="button"
            onClick={() => void retryBootstrap()}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      </ClinicalShell>
    );
  }

  return (
    <ClinicalShell hideHeader>
      <ClinicalWorkspaceLayout
        context={
          <AssessmentContextSidebar
            model={schema.model}
            saveState={saveState}
            isReadOnly={isReadOnly}
            isLocalPreview={isLocalPreview}
            isStarting={saveState === "creating"}
            subjectLabel={subjectLabel}
            onSubjectLabelChange={handleSubjectLabelChange}
            onStartAssessment={() => void handleStartAssessment()}
            onMarkCompleted={() =>
              void markCompleted({
                inputs: values,
                subjectLabel: subjectLabel.trim() || null,
                lastResult: executionResult,
              })
            }
          />
        }
        main={
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <RuntimeStatusBar
                filledRequiredCount={filledRequiredCount}
                requiredCount={runtimeInputCount}
                executeState={executeState}
                saveState={saveState}
                missingCount={missingLabels.length}
                lastUpdatedLabel={lastUpdatedLabel}
                isLocalPreview={isLocalPreview}
              />
              <ClinicalTestValuesPanel
                modelSlug={schema.model.slug}
                inputs={schema.inputs}
                disabled={isReadOnly}
                onApplyExample={handleApplyDemo}
              />
            </div>
            <fieldset disabled={isReadOnly} className="min-w-0 disabled:opacity-80">
              <ClinicalIntakeForm
                sections={schema.sections}
                values={values}
                onValuesChange={handleValuesChange}
              />
            </fieldset>
          </>
        }
        insights={
          <StickyInsightsPanel
            outcomes={schema.outputs.outcomes}
            runtimeReadyCount={schema.runtimeReadyCount}
            result={executionResult}
            executeState={executeState}
            executeError={executeError}
          />
        }
      />
    </ClinicalShell>
  );
}
