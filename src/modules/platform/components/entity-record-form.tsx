"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { FormReadOnlyProvider } from "@/renderer/context/form-read-only-context";
import { WorkspaceRenderer } from "@/renderer/components/workspace-renderer";
import { DynamicFormSkeleton } from "@/renderer/components/dynamic-form-skeleton";
import { formPrimaryButtonClass } from "@/renderer/form-styles";
import { workspaceDefinitionQueryKey } from "@/renderer/hooks/use-workspace-definition";
import { getWorkspaceDefinition } from "@/services/workspace.service";
import { cn } from "@/lib/utils";
import type { EntityRecordDto } from "@/types/entity-record";
import type { FormDefinitionPayload } from "@/renderer/types";
import {
  emptyRecordFormValues,
  recordToFormValues,
  valuesToRecordPayload,
} from "../utils/record-workspace-values";
import { CategoryRecordSelect } from "./category-record-select";

export type EntityRecordFormValues = Record<string, unknown>;

type EntityRecordFormProps = {
  workspaceSlug: string;
  initial?: EntityRecordDto;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  submitLabel: string;
  /** Field keys rendered outside the workspace (e.g. categoryId on drugs). */
  excludeFieldKeys?: string[];
  /** Simple reference UI — Phase A7 only supports category picker for drugs. */
  showCategoryPicker?: boolean;
  readOnly?: boolean;
  /** Enable workspace layout builder (metadata admin). */
  editable?: boolean;
  adminKey?: string;
};

/**
 * Entity-specific form orchestration around WorkspaceRenderer.
 * Do not use WorkspaceRenderer directly on category/drug pages.
 */
export function EntityRecordForm({
  workspaceSlug,
  initial,
  onSubmit,
  submitLabel,
  excludeFieldKeys = [],
  showCategoryPicker = false,
  readOnly = false,
  editable = false,
  adminKey,
}: EntityRecordFormProps) {
  const queryClient = useQueryClient();

  const cachedDefinition = queryClient.getQueryData<FormDefinitionPayload>(
    workspaceDefinitionQueryKey(workspaceSlug),
  );

  const definitionQuery = useQuery({
    queryKey: workspaceDefinitionQueryKey(workspaceSlug),
    queryFn: async () => (await getWorkspaceDefinition(workspaceSlug)).data,
    initialData: cachedDefinition,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const fields = definitionQuery.data?.fields ?? {};
  const [values, setValues] = useState<EntityRecordFormValues>(() =>
    initial && cachedDefinition
      ? recordToFormValues(initial, cachedDefinition.fields)
      : {},
  );
  const [ready, setReady] = useState(
    () => Boolean(initial && cachedDefinition) || Boolean(!initial && cachedDefinition),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inBuilder = editable && !readOnly;

  const excludeKeys = [
    ...excludeFieldKeys,
    ...(showCategoryPicker && !inBuilder ? ["categoryId"] : []),
  ];

  useEffect(() => {
    if (definitionQuery.isLoading && !definitionQuery.data) {
      return;
    }
    setValues(
      initial ? recordToFormValues(initial, fields) : emptyRecordFormValues(fields),
    );
    setReady(true);
  }, [definitionQuery.isLoading, definitionQuery.data, initial, fields]);

  function handleFieldChange(fieldId: string, value: unknown) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = valuesToRecordPayload(values, fields);
      if (showCategoryPicker && values.categoryId) {
        payload.categoryId = values.categoryId;
      }
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record");
    } finally {
      setSubmitting(false);
    }
  }

  const waitingForDefinition =
    definitionQuery.isLoading && !definitionQuery.data;

  return (
    <FormReadOnlyProvider readOnly={readOnly}>
      <form
        onSubmit={readOnly || inBuilder ? (e) => e.preventDefault() : handleSubmit}
        className={inBuilder ? "space-y-6" : "space-y-6"}
      >
        {showCategoryPicker && !inBuilder ? (
          <div className="rounded-lg border bg-card p-4">
            <CategoryRecordSelect
              value={String(values.categoryId ?? "")}
              onChange={(categoryId) => handleFieldChange("categoryId", categoryId)}
              required
            />
          </div>
        ) : null}

        {waitingForDefinition ? (
          <DynamicFormSkeleton />
        ) : (
          <WorkspaceRenderer
            workspaceSlug={workspaceSlug}
            editable={inBuilder}
            values={values}
            onFieldChange={readOnly || inBuilder ? () => {} : handleFieldChange}
            excludeFieldKeys={excludeKeys}
            adminKey={adminKey}
          >
            {!readOnly && !inBuilder ? (
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                {error ? (
                  <p className="text-sm text-red-400">{error}</p>
                ) : null}
                <LoadingButton
                  type="submit"
                  variant="ghost"
                  loading={submitting}
                  loadingText="Saving..."
                  className={cn(formPrimaryButtonClass, "w-full sm:w-auto")}
                  disabled={
                    !ready ||
                    submitting ||
                    Object.keys(fields).length === 0 ||
                    (showCategoryPicker && !values.categoryId)
                  }
                >
                  {submitLabel}
                </LoadingButton>
              </div>
            ) : null}
          </WorkspaceRenderer>
        )}
      </form>
    </FormReadOnlyProvider>
  );
}
