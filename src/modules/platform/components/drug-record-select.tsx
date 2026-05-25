"use client";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatApiError } from "@/lib/api-error";
import { useDrugOptions } from "../hooks/use-drug-options";

type DrugRecordSelectProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  disabled?: boolean;
};

export function DrugRecordSelect({
  value,
  onChange,
  required = false,
  label = "Drug",
  disabled = false,
}: DrugRecordSelectProps) {
  const { data, isLoading, isError, error } = useDrugOptions();
  const optionError = isError
    ? formatApiError(error, { resource: "drugs" })
    : null;

  return (
    <div className="space-y-1">
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {isLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <select
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
        >
          <option value="">Select drug…</option>
          {data?.map((item) => (
            <option key={item.value} value={item.value}>
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
        <p className="text-xs text-muted-foreground">
          No active drugs yet. Create one under Drugs first.
        </p>
      ) : null}
    </div>
  );
}
