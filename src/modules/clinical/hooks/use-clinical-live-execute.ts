"use client";

import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { ApiClientError } from "@/lib/api-error";
import { coerceRuntimeInputs } from "@/modules/clinical/utils/coerce-runtime-inputs";
import { executeModel } from "@/services/runtime.service";
import type { ClinicalIntakeInput } from "@/types/clinical-intake";
import type { RuntimeExecutionResult } from "@/types/runtime";

export type ClinicalExecuteState =
  | "idle"
  | "pending"
  | "running"
  | "ready"
  | "error";

type UseClinicalLiveExecuteOptions = {
  modelId: string;
  inputs: ClinicalIntakeInput[];
  values: Record<string, unknown>;
  enabled: boolean;
  initialResult?: RuntimeExecutionResult | null;
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

export function useClinicalLiveExecute({
  modelId,
  inputs,
  values,
  enabled,
  initialResult = null,
  onResult,
}: UseClinicalLiveExecuteOptions) {
  const [result, setResult] = useState<RuntimeExecutionResult | null>(
    initialResult,
  );
  const [executeState, setExecuteState] =
    useState<ClinicalExecuteState>("idle");
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [missingLabels, setMissingLabels] = useState<string[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const requestSeqRef = useRef(0);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    setResult(initialResult ?? null);
    if (initialResult) {
      setExecuteState("ready");
    }
  }, [initialResult]);

  const runExecute = useDebouncedCallback(
    async (bindings: Record<string, number>) => {
      const seq = ++requestSeqRef.current;
      setExecuteState("running");
      setExecuteError(null);

      try {
        const response = await executeModel(modelId, bindings);
        if (seq !== requestSeqRef.current) {
          return;
        }
        setResult(response.data);
        setExecuteState("ready");
        setLastUpdatedAt(Date.now());
        onResultRef.current?.(response.data);
      } catch (error) {
        if (seq !== requestSeqRef.current) {
          return;
        }
        setExecuteState("error");
        setExecuteError(formatExecuteError(error));
      }
    },
    500,
  );

  useEffect(() => {
    if (!enabled) {
      setMissingLabels([]);
      return;
    }

    const { bindings, missingLabels: missing } = coerceRuntimeInputs(
      inputs,
      values,
    );

    setMissingLabels(missing);

    if (missing.length > 0) {
      requestSeqRef.current += 1;
      setExecuteState("idle");
      setExecuteError(null);
      return;
    }

    setExecuteState("pending");
    runExecute(bindings);
  }, [enabled, inputs, values, runExecute]);

  return {
    result,
    executeState,
    executeError,
    missingLabels,
    lastUpdatedAt,
  };
}
