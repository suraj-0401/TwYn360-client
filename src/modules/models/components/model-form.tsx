"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { FormReadOnlyProvider } from "@/renderer/context/form-read-only-context";
import { WorkspaceRenderer } from "@/renderer/components/workspace-renderer";
import { DynamicFormSkeleton } from "@/renderer/components/dynamic-form-skeleton";
import { formPrimaryButtonClass } from "@/renderer/form-styles";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { workspaceDefinitionQueryKey } from "@/renderer/hooks/use-workspace-definition";
import { getWorkspaceDefinition } from "@/services/workspace.service";
import { cn } from "@/lib/utils";
import { formatApiError } from "@/lib/api-error";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import { useModelFieldConfig } from "../hooks/use-model-field-config";
import { ModelSystemFields } from "./model-system-fields";
import type { FormDefinitionPayload } from "@/renderer/types";
import type { ModelDto } from "@/types/model";
import {
  emptyCustomValues,
  hasCustomWorkspaceFields,
  modelToFormValues,
  valuesToCreatePayload,
  valuesToUpdatePayload,
  type ModelFormValues,
} from "../utils/model-workspace-values";

type ModelFormBaseProps = {
  submitLabel: string;
  layout?: "standalone" | "workspace";
  formId?: string;
  hideSubmitButton?: boolean;
  onSavingChange?: (saving: boolean) => void;
  adminKey?: string;
  editable?: boolean;
  readOnly?: boolean;
};

type ModelFormCreateProps = ModelFormBaseProps & {
  mode: "create";
  initialDrugId?: string;
  onSubmit: (payload: ReturnType<typeof valuesToCreatePayload>) => Promise<void>;
};

type ModelFormEditProps = ModelFormBaseProps & {
  mode: "edit";
  initial: ModelDto;
  onSubmit: (payload: ReturnType<typeof valuesToUpdatePayload>) => Promise<void>;
};

export type ModelFormProps = ModelFormCreateProps | ModelFormEditProps;

export function ModelForm(props: ModelFormProps) {
  const workspaceSlug = WORKSPACE_SLUGS.MODEL_FORM;
  const queryClient = useQueryClient();
  const fieldConfigQuery = useModelFieldConfig();
  const fieldConfig = fieldConfigQuery.data;

  const cachedDefinition = queryClient.getQueryData<FormDefinitionPayload>(
    workspaceDefinitionQueryKey(workspaceSlug),
  );

  const definitionQuery = useQuery<FormDefinitionPayload>({
    queryKey: workspaceDefinitionQueryKey(workspaceSlug),
    queryFn: async () => (await getWorkspaceDefinition(workspaceSlug)).data,
    initialData: cachedDefinition,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const fields = definitionQuery.data?.fields ?? {};

  const isArchivedEdit =
    props.mode === "edit" &&
    props.initial.statusCode === LIFECYCLE_STATUS.ARCHIVED;
  const formReadOnly = props.readOnly ?? false;
  const fieldsLocked = props.mode === "edit" && (props.readOnly ?? false);
  const structureLocked =
    props.mode === "edit" &&
    props.initial.statusCode === LIFECYCLE_STATUS.ACTIVE &&
    !isArchivedEdit;

  const [values, setValues] = useState<ModelFormValues>(() => {
    if (props.mode === "edit" && cachedDefinition) {
      return modelToFormValues(props.initial, cachedDefinition.fields);
    }
    return {
      drugId: props.mode === "create" ? (props.initialDrugId ?? "") : "",
      name: "",
      displayName: "",
      description: "",
      frameworkType: "",
      statusCode: "",
      custom: cachedDefinition ? emptyCustomValues(cachedDefinition.fields) : {},
    };
  });
  const [ready, setReady] = useState(
    () =>
      Boolean(props.mode === "edit" && cachedDefinition) ||
      Boolean(props.mode === "create" && cachedDefinition),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (definitionQuery.isLoading && !definitionQuery.data) {
      return;
    }
    const fieldMap = definitionQuery.data?.fields ?? {};
    setValues((prev) =>
      props.mode === "edit"
        ? modelToFormValues(props.initial, fieldMap)
        : {
            drugId: props.initialDrugId ?? "",
            name: "",
            displayName: "",
            description: "",
            frameworkType: "",
            statusCode:
              prev.statusCode || fieldConfig?.creatableStatusCodes[0] || "",
            custom: emptyCustomValues(fieldMap),
          },
    );
    setReady(true);
  }, [
    definitionQuery.isLoading,
    definitionQuery.data,
    props.mode,
    props.mode === "edit" ? props.initial.id : null,
    props.mode === "edit" ? props.initial.version : null,
    fieldConfig?.creatableStatusCodes,
  ]);

  useEffect(() => {
    if (props.mode !== "create" || !fieldConfig?.creatableStatusCodes[0]) {
      return;
    }
    setValues((prev) =>
      prev.statusCode ? prev : { ...prev, statusCode: fieldConfig.creatableStatusCodes[0] },
    );
  }, [props.mode, fieldConfig]);

  function update<K extends keyof ModelFormValues>(
    key: K,
    value: ModelFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleCustomFieldChange(fieldId: string, value: unknown) {
    setValues((prev) => ({
      ...prev,
      custom: { ...prev.custom, [fieldId]: value },
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!values.drugId) {
      setError("Select a drug for this model.");
      return;
    }
    if (!values.name.trim() || !values.displayName.trim()) {
      setError("Name and display name are required.");
      return;
    }
    if (props.mode === "create" && !values.statusCode) {
      setError("Status options are still loading. Try again in a moment.");
      return;
    }

    setSubmitting(true);
    props.onSavingChange?.(true);
    try {
      if (props.mode === "create") {
        await props.onSubmit(valuesToCreatePayload(values, fields));
      } else {
        await props.onSubmit(
          valuesToUpdatePayload(values, fields, props.initial.version),
        );
      }
    } catch (err) {
      setError(formatApiError(err).message);
    } finally {
      setSubmitting(false);
      props.onSavingChange?.(false);
    }
  }

  const hideSubmit = props.hideSubmitButton ?? false;
  const formId = props.formId;
  const inBuilder = Boolean(props.editable && !formReadOnly);
  const waitingForDefinition =
    definitionQuery.isLoading && !definitionQuery.data;
  const showCustomSection = hasCustomWorkspaceFields(definitionQuery.data);

  const drugLabel =
    props.mode === "edit"
      ? props.initial.drug.displayName ||
        props.initial.drug.slug ||
        props.initial.drugId
      : null;

  if (!ready && waitingForDefinition) {
    return <DynamicFormSkeleton />;
  }

  return (
    <FormReadOnlyProvider readOnly={formReadOnly}>
      <form
        id={formId}
        onSubmit={formReadOnly ? (e) => e.preventDefault() : handleSubmit}
        className={cn("space-y-6", inBuilder && "space-y-8")}
      >
        {!inBuilder ? (
          <ModelSystemFields
            mode={props.mode}
            values={values}
            onChange={update}
            fieldConfig={fieldConfig}
            fieldConfigLoading={fieldConfigQuery.isLoading}
            readOnly={formReadOnly}
            fieldsLocked={fieldsLocked}
            structureLocked={structureLocked}
            initialDrugId={props.mode === "create" ? props.initialDrugId : undefined}
            editSlug={props.mode === "edit" ? props.initial.slug : undefined}
            editDrugLabel={drugLabel}
            initialStatusCode={
              props.mode === "edit" ? props.initial.statusCode : undefined
            }
          />
        ) : null}

        {showCustomSection ? (
          <div className="space-y-3">
            {!inBuilder ? (
              <div>
                <h3 className="text-sm font-medium text-[#f4f4f5]">
                  Scientific metadata
                </h3>
                <p className="mt-1 text-xs text-[#71717a]">
                  Custom fields from the model form builder.
                </p>
              </div>
            ) : null}
            <WorkspaceRenderer
              workspaceSlug={workspaceSlug}
              editable={inBuilder}
              values={values.custom}
              onFieldChange={formReadOnly ? () => {} : handleCustomFieldChange}
              adminKey={props.adminKey}
            />
          </div>
        ) : inBuilder ? (
          <WorkspaceRenderer
            workspaceSlug={workspaceSlug}
            editable={inBuilder}
            values={values.custom}
            onFieldChange={() => {}}
            adminKey={props.adminKey}
          />
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {isArchivedEdit ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Archived models are read-only. Saving restores the model to active.
          </p>
        ) : null}

        {!inBuilder && !hideSubmit ? (
          <LoadingButton
            type="submit"
            loading={submitting}
            disabled={
              submitting ||
              waitingForDefinition ||
              (props.mode === "create" &&
                (fieldConfigQuery.isLoading || !values.statusCode))
            }
            className="bg-[#f4f4f5] text-[#0a0a0a] hover:bg-white"
          >
            {isArchivedEdit ? "Restore to active" : props.submitLabel}
          </LoadingButton>
        ) : null}
      </form>
    </FormReadOnlyProvider>
  );
}
