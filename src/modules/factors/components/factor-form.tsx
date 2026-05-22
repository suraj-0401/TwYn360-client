"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { FormReadOnlyProvider } from "@/renderer/context/form-read-only-context";
import { WorkspaceRenderer } from "@/renderer/components/workspace-renderer";
import { formPrimaryButtonClass } from "@/renderer/form-styles";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { workspaceDefinitionQueryKey } from "@/renderer/hooks/use-workspace-definition";
import { getWorkspaceDefinition } from "@/services/workspace.service";
import { cn } from "@/lib/utils";
import type { Factor } from "@/types/factor";
import type { FormDefinitionPayload } from "@/renderer/types";
import {
  emptyFormValues,
  factorToFormValues,
  resolveDataTypeFieldId,
  resolveUnitFieldId,
  valuesToFactorPayload,
} from "../utils/factor-workspace-values";

export type FactorFormValues = Record<string, unknown>;

type FactorFormProps = {
  initial?: Factor;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  submitLabel: string;
  adminKey?: string;
  editable?: boolean;
  /** View-only: no submit, fields not editable. */
  readOnly?: boolean;
};

export function FactorForm({
  initial,
  onSubmit,
  submitLabel,
  adminKey,
  editable = false,
  readOnly = false,
}: FactorFormProps) {
  const workspaceSlug = WORKSPACE_SLUGS.FACTOR_REGISTRY;
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
  const [values, setValues] = useState<FactorFormValues>(() =>
    initial && cachedDefinition
      ? factorToFormValues(initial, cachedDefinition.fields)
      : {},
  );
  const [ready, setReady] = useState(
    () => Boolean(initial && cachedDefinition) || Boolean(!initial && cachedDefinition),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dataTypeFieldId = useMemo(
    () => resolveDataTypeFieldId(fields),
    [fields],
  );
  const unitFieldId = useMemo(() => resolveUnitFieldId(fields), [fields]);

  useEffect(() => {
    if (definitionQuery.isLoading && !definitionQuery.data) {
      return;
    }
    setValues(
      initial ? factorToFormValues(initial, fields) : emptyFormValues(fields),
    );
    setReady(true);
  }, [definitionQuery.isLoading, definitionQuery.data, initial, fields]);

  function handleFieldChange(fieldId: string, value: unknown) {
    setValues((prev) => {
      const next = { ...prev, [fieldId]: value };

      if (dataTypeFieldId && fieldId === dataTypeFieldId) {
        next.validations = {};
        if (unitFieldId) {
          next[unitFieldId] = "";
        }
      }

      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(
        valuesToFactorPayload(values, fields, { isUpdate: Boolean(initial) }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save factor");
    } finally {
      setSubmitting(false);
    }
  }

  const waitingForDefinition =
    definitionQuery.isLoading && !definitionQuery.data;

  return (
    <FormReadOnlyProvider readOnly={readOnly}>
      <form
        onSubmit={readOnly ? (e) => e.preventDefault() : handleSubmit}
        className={editable ? "space-y-6" : undefined}
      >
        <WorkspaceRenderer
          workspaceSlug={workspaceSlug}
          editable={editable}
          values={values}
          onFieldChange={readOnly ? () => {} : handleFieldChange}
          adminKey={adminKey}
        >
          {!editable && !readOnly ? (
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
                  waitingForDefinition ||
                  Object.keys(fields).length === 0
                }
              >
                {submitLabel}
              </LoadingButton>
            </div>
          ) : null}
        </WorkspaceRenderer>
      </form>
    </FormReadOnlyProvider>
  );
}
