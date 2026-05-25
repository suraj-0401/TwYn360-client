"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { MODEL_FRAMEWORK_TYPE_LOOKUP } from "@/config/models";
import { formatApiError } from "@/lib/api-error";
import { useCollectionValues } from "@/modules/lookups/hooks/use-collection-values";

type ModelFrameworkSelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Lookup type from GET /models/config (falls back to MODEL_FRAMEWORK_TYPE_LOOKUP). */
  lookupCode?: string;
};

export function ModelFrameworkSelect({
  label = "Framework type",
  value,
  onChange,
  disabled = false,
  lookupCode = MODEL_FRAMEWORK_TYPE_LOOKUP,
}: ModelFrameworkSelectProps) {
  const { data, isLoading, isError, error } = useCollectionValues(lookupCode);

  const optionError = isError
    ? formatApiError(error, { resource: `${label} options` })
    : null;

  const manageHref = `/lookups/${encodeURIComponent(lookupCode)}`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="model-framework">{label}</Label>
        <Link
          href={manageHref}
          className="text-xs text-[#a1a1aa] underline-offset-2 hover:text-[#f4f4f5] hover:underline"
        >
          Manage types
        </Link>
      </div>
      {isLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <select
          id="model-framework"
          className="flex h-9 w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 text-sm disabled:opacity-50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">— None —</option>
          {data?.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
      )}
      {optionError ? (
        <p className="text-xs text-destructive/90" role="alert">
          {optionError.message}
        </p>
      ) : null}
      {!isLoading && !isError && (data?.length ?? 0) === 0 ? (
        <p className="text-xs text-[#71717a]">
          No framework types configured. Add values under Lookups.
        </p>
      ) : null}
    </div>
  );
}
