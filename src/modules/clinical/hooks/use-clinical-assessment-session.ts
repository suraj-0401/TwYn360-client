"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import {
  createClinicalAssessment,
  getClinicalAssessment,
  updateClinicalAssessment,
} from "@/services/clinical-assessment.service";
import type { ClinicalAssessment } from "@/types/clinical-assessment";
import type { RuntimeExecutionResult } from "@/types/runtime";

export type ClinicalAssessmentSaveState =
  | "idle"
  | "loading"
  | "creating"
  | "saving"
  | "saved"
  | "error";

type UseClinicalAssessmentSessionOptions = {
  modelId: string;
  initialAssessmentId?: string | null;
};

type SavePayload = {
  inputs: Record<string, unknown>;
  subjectLabel?: string | null;
};

/** Dedupe draft creation when start + first edit race. */
const inflightCreates = new Map<string, Promise<ClinicalAssessment>>();

export function useClinicalAssessmentSession({
  modelId,
  initialAssessmentId,
}: UseClinicalAssessmentSessionOptions) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<ClinicalAssessment | null>(null);
  const [saveState, setSaveState] = useState<ClinicalAssessmentSaveState>(
    initialAssessmentId ? "loading" : "idle",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const versionRef = useRef(1);
  const assessmentRef = useRef<ClinicalAssessment | null>(null);

  assessmentRef.current = assessment;

  const syncUrl = useCallback(
    (assessmentId: string) => {
      router.replace(
        `/clinical/models/${modelId}/assess?assessmentId=${assessmentId}`,
        { scroll: false },
      );
    },
    [modelId, router],
  );

  const createDraft = useCallback(
    async (payload: SavePayload = { inputs: {} }): Promise<ClinicalAssessment> => {
      const current = assessmentRef.current;
      if (current) {
        return current;
      }

      const inflight = inflightCreates.get(modelId);
      if (inflight) {
        return inflight;
      }

      setSaveState("creating");
      setLoadError(null);

      const promise = createClinicalAssessment(modelId, {
        inputs: payload.inputs,
        subjectLabel: payload.subjectLabel?.trim() || undefined,
      })
        .then((response) => {
          const row = response.data;
          assessmentRef.current = row;
          setAssessment(row);
          versionRef.current = row.version;
          setSaveState("saved");
          syncUrl(row.id);
          return row;
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : "Could not start assessment";
          setLoadError(message);
          setSaveState("error");
          throw error;
        })
        .finally(() => {
          inflightCreates.delete(modelId);
        });

      inflightCreates.set(modelId, promise);
      return promise;
    },
    [modelId, syncUrl],
  );

  const loadExisting = useCallback(async (assessmentId: string) => {
    setSaveState("loading");
    setLoadError(null);

    try {
      const row = (await getClinicalAssessment(assessmentId)).data;
      assessmentRef.current = row;
      setAssessment(row);
      versionRef.current = row.version;
      setSaveState("saved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load assessment";
      setLoadError(message);
      setSaveState("error");
    }
  }, []);

  useEffect(() => {
    if (!initialAssessmentId) {
      return;
    }
    void loadExisting(initialAssessmentId);
  }, [initialAssessmentId, loadExisting]);

  const persist = useCallback(async (payload: SavePayload) => {
    const current = assessmentRef.current;
    if (!current || current.statusCode === "completed") {
      return;
    }

    setSaveState("saving");
    try {
      const response = await updateClinicalAssessment(current.id, {
        inputs: payload.inputs,
        subjectLabel: payload.subjectLabel,
        expectedVersion: versionRef.current,
      });
      assessmentRef.current = response.data;
      setAssessment(response.data);
      versionRef.current = response.data.version;
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, []);

  const debouncedPersist = useDebouncedCallback(persist, 700);

  const ensureDraft = useCallback(
    async (payload: SavePayload) => {
      if (assessmentRef.current) {
        return assessmentRef.current;
      }
      return createDraft(payload);
    },
    [createDraft],
  );

  const startAssessment = useCallback(
    async (payload: SavePayload = { inputs: {} }) => ensureDraft(payload),
    [ensureDraft],
  );

  const queueSave = useCallback(
    (payload: SavePayload) => {
      if (assessmentRef.current?.statusCode === "completed") {
        return;
      }

      void (async () => {
        try {
          await ensureDraft(payload);
          debouncedPersist(payload);
        } catch {
          // createDraft already surfaced error state
        }
      })();
    },
    [ensureDraft, debouncedPersist],
  );

  const persistLastResult = useCallback(
    async (lastResult: RuntimeExecutionResult) => {
      const current = assessmentRef.current;
      if (!current || current.statusCode === "completed") {
        return;
      }

      try {
        const response = await updateClinicalAssessment(current.id, {
          lastResult,
          expectedVersion: versionRef.current,
        });
        assessmentRef.current = response.data;
        setAssessment(response.data);
        versionRef.current = response.data.version;
      } catch {
        // Keep in-memory results even if persistence races with input autosave.
      }
    },
    [],
  );

  const markCompleted = useCallback(
    async (snapshot: SavePayload & { lastResult?: RuntimeExecutionResult | null }) => {
      setSaveState("saving");
      try {
        const current =
          assessmentRef.current ??
          (await createDraft({
            inputs: snapshot.inputs,
            subjectLabel: snapshot.subjectLabel,
          }));

        const response = await updateClinicalAssessment(current.id, {
          statusCode: "completed",
          inputs: snapshot.inputs,
          subjectLabel: snapshot.subjectLabel,
          lastResult: snapshot.lastResult ?? undefined,
          expectedVersion: versionRef.current,
        });
        assessmentRef.current = response.data;
        setAssessment(response.data);
        versionRef.current = response.data.version;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [createDraft],
  );

  const retryBootstrap = useCallback(() => {
    if (initialAssessmentId) {
      void loadExisting(initialAssessmentId);
      return;
    }
    setSaveState("idle");
    setLoadError(null);
  }, [initialAssessmentId, loadExisting]);

  const isReadOnly = assessment?.statusCode === "completed";
  const isStarted = assessment !== null;
  const isLocalPreview = !initialAssessmentId && !isStarted;
  const isLoading = saveState === "loading" && Boolean(initialAssessmentId);
  const hasLoadError =
    saveState === "error" && Boolean(initialAssessmentId) && !assessment;

  return {
    assessment,
    saveState,
    loadError,
    isLoading,
    hasLoadError,
    isReadOnly,
    isLocalPreview,
    isStarted,
    startAssessment,
    queueSave,
    persistLastResult,
    markCompleted,
    retryBootstrap,
  };
}
