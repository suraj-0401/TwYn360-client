"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import { DrugRecordSelect } from "@/modules/platform/components/drug-record-select";
import type { ModelFieldConfig } from "@/types/model-config";
import { ModelFrameworkSelect } from "./model-framework-select";
import { ModelStatusSelect } from "./model-status-select";
import type { ModelFormValues } from "../utils/model-workspace-values";

type ModelSystemFieldsProps = {
  mode: "create" | "edit";
  values: ModelFormValues;
  onChange: <K extends keyof ModelFormValues>(
    key: K,
    value: ModelFormValues[K],
  ) => void;
  fieldConfig: ModelFieldConfig | undefined;
  fieldConfigLoading: boolean;
  readOnly: boolean;
  fieldsLocked: boolean;
  structureLocked: boolean;
  initialDrugId?: string;
  editSlug?: string;
  editDrugLabel?: string | null;
  initialStatusCode?: string;
};

export function ModelSystemFields({
  mode,
  values,
  onChange,
  fieldConfig,
  fieldConfigLoading,
  readOnly,
  fieldsLocked,
  structureLocked,
  initialDrugId,
  editSlug,
  editDrugLabel,
  initialStatusCode,
}: ModelSystemFieldsProps) {
  const isCreate = mode === "create";

  return (
    <div
      className={
        isCreate
          ? "space-y-5"
          : "space-y-5 rounded-lg border border-white/[0.06] bg-[#111113] p-6"
      }
    >
      {!isCreate ? (
        <div>
          <h3 className="text-sm font-medium text-[#f4f4f5]">Workspace header</h3>
          <p className="mt-1 text-xs text-[#71717a]">
            Drug, status, and framework are platform-defined. Custom scientific
            fields are below.
          </p>
        </div>
      ) : null}

      {mode === "create" ? (
        <DrugRecordSelect
          value={values.drugId}
          onChange={(drugId) => onChange("drugId", drugId)}
          required
          disabled={Boolean(initialDrugId) || readOnly || fieldsLocked}
        />
      ) : (
        <div className="space-y-1">
          <Label>Drug</Label>
          <p className="text-sm text-[#f4f4f5]">{editDrugLabel}</p>
          <p className="text-xs text-[#71717a]">
            Drug is fixed for an existing model.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="model-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="model-name"
            value={values.name}
            onChange={(e) => onChange("name", e.target.value)}
            required
            disabled={fieldsLocked || structureLocked}
            className="border-white/10 bg-[#0a0a0a]"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="model-display-name">
            Display name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="model-display-name"
            value={values.displayName}
            onChange={(e) => onChange("displayName", e.target.value)}
            required
            disabled={fieldsLocked}
            className="border-white/10 bg-[#0a0a0a]"
          />
        </div>
      </div>

      {mode === "edit" && editSlug ? (
        <div className="space-y-1">
          <Label htmlFor="model-slug">Slug</Label>
          <Input
            id="model-slug"
            value={editSlug}
            readOnly
            disabled
            className="border-white/10 bg-[#0a0a0a] font-mono text-xs"
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="model-description">Description</Label>
        <Textarea
          id="model-description"
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          disabled={fieldsLocked}
          className="border-white/10 bg-[#0a0a0a]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModelFrameworkSelect
          value={values.frameworkType}
          onChange={(v) => onChange("frameworkType", v)}
          disabled={fieldsLocked || structureLocked}
          lookupCode={fieldConfig?.lookups.frameworkType}
        />
        <ModelStatusSelect
          config={fieldConfig}
          configLoading={fieldConfigLoading}
          value={values.statusCode}
          onChange={(v) => onChange("statusCode", v)}
          mode={mode}
          initialStatusCode={initialStatusCode}
          disabled={
            readOnly &&
            !(
              mode === "edit" &&
              initialStatusCode === LIFECYCLE_STATUS.ARCHIVED
            )
          }
        />
      </div>

      {structureLocked ? (
        <p className="text-sm text-[#71717a]">
          Active workspaces lock internal name and framework. Use Settings to
          archive, or edit display name and description only.
        </p>
      ) : null}
    </div>
  );
}
