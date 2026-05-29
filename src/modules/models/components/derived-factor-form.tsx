"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DynamicFormSkeleton } from "@/renderer/components/dynamic-form-skeleton";
import { FormReadOnlyProvider } from "@/renderer/context/form-read-only-context";
import { WorkspaceRenderer } from "@/renderer/components/workspace-renderer";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { workspaceDefinitionQueryKey } from "@/renderer/hooks/use-workspace-definition";
import { getWorkspaceDefinition } from "@/services/workspace.service";
import { cn } from "@/lib/utils";
import type { FormDefinitionPayload } from "@/renderer/types";
import type { DerivedFactorDefinitionDto } from "@/types/formula";
import {
  derivedFactorToFormValues,
  emptyFormValues,
  valuesToCreatePayload,
  valuesToUpdatePayload,
} from "../utils/derived-factor-workspace-values";

export type DerivedFactorFormValues = Record<string, unknown>;

function slugifyDisplayName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

type DerivedFactorFormProps = {
  mode: "create" | "edit";
  initial?: DerivedFactorDefinitionDto;
  onSubmit: (
    payload: ReturnType<typeof valuesToCreatePayload> | ReturnType<typeof valuesToUpdatePayload>,
  ) => Promise<void>;
  submitLabel?: string;
  formId?: string;
  hideSubmitButton?: boolean;
  readOnly?: boolean;
  editable?: boolean;
  adminKey?: string;
  excludeFieldKeys?: string[];
  layout?: "standalone" | "dialog" | "workspace";
  onSavingChange?: (saving: boolean) => void;
  children?: React.ReactNode;
};

export function DerivedFactorForm({
  mode,
  initial,
  onSubmit,
  formId,
  hideSubmitButton = true,
  readOnly = false,
  editable = false,
  adminKey,
  excludeFieldKeys,
  layout = "dialog",
  onSavingChange,
  children,
}: DerivedFactorFormProps) {
  const workspaceSlug = WORKSPACE_SLUGS.DERIVED_FACTOR_FORM;
  const queryClient = useQueryClient();
  const slugTouchedRef = useRef(false);

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
  const [values, setValues] = useState<DerivedFactorFormValues>(() => {
    if (mode === "edit" && initial && cachedDefinition) {
      return derivedFactorToFormValues(initial, cachedDefinition.fields);
    }
    if (cachedDefinition) {
      return emptyFormValues(cachedDefinition.fields);
    }
    return {};
  });
  const [ready, setReady] = useState(
    () =>
      Boolean(mode === "edit" && initial && cachedDefinition) ||
      Boolean(mode === "create" && cachedDefinition),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mergedExclude = useMemo(() => {
    const keys = new Set(excludeFieldKeys ?? []);
    if (mode === "edit") {
      keys.add("slug");
    }
    return [...keys];
  }, [excludeFieldKeys, mode]);

  useEffect(() => {
    if (definitionQuery.isLoading && !definitionQuery.data) {
      return;
    }
    const fieldMap = definitionQuery.data?.fields ?? {};
    setValues(
      mode === "edit" && initial
        ? derivedFactorToFormValues(initial, fieldMap)
        : emptyFormValues(fieldMap),
    );
    setReady(true);
    slugTouchedRef.current = mode === "edit";
  }, [definitionQuery.isLoading, definitionQuery.data, initial, mode]);

  useEffect(() => {
    if (mode !== "create" || slugTouchedRef.current) {
      return;
    }
    const displayName = values.displayName;
    if (typeof displayName !== "string" || !displayName.trim()) {
      return;
    }
    const nextSlug = slugifyDisplayName(displayName);
    setValues((previous) =>
      previous.slug === nextSlug ? previous : { ...previous, slug: nextSlug },
    );
  }, [values.displayName, mode]);

  function handleFieldChange(fieldId: string, value: unknown) {
    if (fieldId === "slug") {
      slugTouchedRef.current = true;
    }
    setValues((previous) => ({ ...previous, [fieldId]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (readOnly || editable) {
      return;
    }

    setSubmitting(true);
    onSavingChange?.(true);
    setError(null);

    try {
      const payload =
        mode === "create"
          ? valuesToCreatePayload(values, fields)
          : valuesToUpdatePayload(values, fields);
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save derived factor");
    } finally {
      setSubmitting(false);
      onSavingChange?.(false);
    }
  }

  const waitingForDefinition =
    definitionQuery.isLoading && !definitionQuery.data;

  if (waitingForDefinition && !ready) {
    return <DynamicFormSkeleton />;
  }

  const isDialog = layout === "dialog";

  return (
    <FormReadOnlyProvider readOnly={readOnly}>
      <form
        id={formId}
        onSubmit={readOnly || editable ? (event) => event.preventDefault() : handleSubmit}
        className={cn(editable ? "space-y-4" : undefined)}
      >
        <WorkspaceRenderer
          workspaceSlug={workspaceSlug}
          editable={editable}
          values={values}
          onFieldChange={readOnly || editable ? () => {} : handleFieldChange}
          adminKey={adminKey}
          excludeFieldKeys={mergedExclude}
        />
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        {children}
        {!hideSubmitButton && !editable && !readOnly && !isDialog ? (
          <div className="mt-4">
            <button
              type="submit"
              disabled={submitting || !ready || Object.keys(fields).length === 0}
              className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-200"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        ) : null}
      </form>
    </FormReadOnlyProvider>
  );
}
