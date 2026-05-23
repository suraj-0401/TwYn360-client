"use client";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatApiError } from "@/lib/api-error";
import { useCategoryOptions } from "../hooks/use-category-options";

type CategoryRecordSelectProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
};

/** Simple async select for drug → category (Phase A7; not a generic reference framework). */
export function CategoryRecordSelect({
  value,
  onChange,
  required = false,
  label = "Category",
}: CategoryRecordSelectProps) {
  const { data, isLoading, isError, error } = useCategoryOptions();
  const optionError = isError
    ? formatApiError(error, { resource: "categories" })
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
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        >
          <option value="">Select category…</option>
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
          No categories yet. Create one under Categories first.
        </p>
      ) : null}
    </div>
  );
}
