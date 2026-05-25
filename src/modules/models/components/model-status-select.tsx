"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import { formatApiError } from "@/lib/api-error";
import { useCollectionValues } from "@/modules/lookups/hooks/use-collection-values";
import type { ModelFieldConfig } from "@/types/model-config";

type ModelStatusSelectProps = {
  config: ModelFieldConfig | undefined;
  configLoading?: boolean;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  mode: "create" | "edit";
  /** Current persisted status (edit mode). */
  initialStatusCode?: string;
};

function allowedStatusCodes(
  config: ModelFieldConfig,
  mode: "create" | "edit",
  initialStatusCode: string | undefined,
  currentValue: string,
): string[] {
  if (mode === "create") {
    return [...config.creatableStatusCodes];
  }

  const from = initialStatusCode ?? currentValue;
  const transitions =
    config.formStatusTransitions[from as keyof typeof config.formStatusTransitions];
  const allowed = new Set<string>([from]);
  if (transitions) {
    for (const code of transitions) {
      allowed.add(code);
    }
  }

  return [...allowed];
}

export function ModelStatusSelect({
  config,
  configLoading,
  label = "Status",
  value,
  onChange,
  disabled = false,
  mode,
  initialStatusCode,
}: ModelStatusSelectProps) {
  const lookupCode = config?.lookups.statusCode ?? "";
  const { data: options, isLoading, isError, error } =
    useCollectionValues(lookupCode);

  const allowed = useMemo(() => {
    if (!config) {
      return [];
    }
    return allowedStatusCodes(config, mode, initialStatusCode, value);
  }, [config, mode, initialStatusCode, value]);

  const filtered = useMemo(() => {
    if (!options) {
      return [];
    }
    const allowedSet = new Set(allowed);
    return options.filter((opt) => allowedSet.has(opt.code));
  }, [options, allowed]);

  const optionError = isError
    ? formatApiError(error, { resource: `${label} options` })
    : null;

  const loading = configLoading || isLoading || !config;

  return (
    <div className="space-y-1">
      <Label htmlFor="model-status">{label}</Label>
      {loading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <select
          id="model-status"
          className="flex h-9 w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 text-sm disabled:opacity-50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {filtered.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code === LIFECYCLE_STATUS.ACTIVE &&
              initialStatusCode === LIFECYCLE_STATUS.ARCHIVED
                ? "Active (restore)"
                : item.label}
            </option>
          ))}
        </select>
      )}
      {optionError ? (
        <p className="text-xs text-destructive/90" role="alert">
          {optionError.message}
        </p>
      ) : null}
      {mode === "edit" &&
      initialStatusCode === LIFECYCLE_STATUS.ARCHIVED ? (
        <p className="text-xs text-[#71717a]">
          Other fields are read-only until you restore to active.
        </p>
      ) : mode === "edit" ? (
        <p className="text-xs text-[#71717a]">
          Lifecycle: draft and active only here. Use Archive on the model page
          to move to archived.
        </p>
      ) : null}
    </div>
  );
}
