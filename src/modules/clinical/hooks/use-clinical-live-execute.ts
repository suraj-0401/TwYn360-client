"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiClientError } from "@/lib/api-error";
import {
  coerceRuntimeInputs,
  type RuntimeInputBinding,
} from "@/modules/clinical/utils/coerce-runtime-inputs";
import { executeModel } from "@/services/runtime.service";
import type { ClinicalIntakeInput } from "@/types/clinical-intake";
import type { RuntimeExecutionResult } from "@/types/runtime";

export type ClinicalExecuteState =
  | "idle"
  | "running"
  | "ready"
  | "error";

type UseClinicalLiveExecuteOptions = {
  modelId: string;
  inputs: ClinicalIntakeInput[];
  values: Record<string, unknown>;
  enabled: boolean;
  onResult?: (result: RuntimeExecutionResult) => void;
};

function formatExecuteError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Execution failed";
}

/** Manual submit only — no live/auto calculation while typing. */
export function useClinicalLiveExecute({
  modelId,
  inputs,
  values,
  enabled,
  onResult,
}: UseClinicalLiveExecuteOptions) {
  const [result, setResult] = useState<RuntimeExecutionResult | null>(null);
  const [executeState, setExecuteState] =
    useState<ClinicalExecuteState>("idle");
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const requestSeqRef = useRef(0);
  const onResultRef = useRef(onResult);

  const valuesKey = useMemo(() => JSON.stringify(values), [values]);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    setResult(null);
    setExecuteState("idle");
    setExecuteError(null);
    setHasAttemptedSubmit(false);
  }, [valuesKey]);

  const { missingLabels } = useMemo(
    () => coerceRuntimeInputs(inputs, values),
    [inputs, values],
  );

  const canSubmit =
    enabled && missingLabels.length === 0 && executeState !== "running";

  const submit = useCallback(async () => {
    if (!enabled) {
      return;
    }

    const { bindings: nextBindings, missingLabels: missing } =
      coerceRuntimeInputs(inputs, values);

    if (missing.length > 0) {
      setExecuteState("idle");
      setExecuteError(null);
      setHasAttemptedSubmit(false);
      return;
    }

    const seq = ++requestSeqRef.current;
    setHasAttemptedSubmit(true);
    setExecuteState("running");
    setExecuteError(null);
    setResult(null);

    try {
      const response = await executeModel(modelId, nextBindings);
      if (seq !== requestSeqRef.current) {
        return;
      }
      setResult(response.data);
      setExecuteState("ready");
      onResultRef.current?.(response.data);
    } catch (error) {
      if (seq !== requestSeqRef.current) {
        return;
      }
      setResult(null);
      setExecuteState("error");
      setExecuteError(formatExecuteError(error));
    }
  }, [enabled, inputs, modelId, values]);

  return {
    result,
    executeState,
    executeError,
    hasAttemptedSubmit,
    missingLabels,
    canSubmit,
    submit,
  };
}

export type { RuntimeInputBinding };
