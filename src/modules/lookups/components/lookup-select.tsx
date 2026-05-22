"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { formatApiError } from "@/lib/api-error";
import { useCollectionValues } from "../hooks/use-collection-values";
import { AddLookupModal } from "./add-lookup-modal";

type LookupSelectProps = {
  /** Lookup type code (e.g. FACTOR_CATEGORY) or collection UUID. */
  typeCode: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowAdd?: boolean;
  adminKey?: string;
};

export function LookupSelect({
  typeCode,
  label,
  value,
  onChange,
  allowAdd = false,
  adminKey,
}: LookupSelectProps) {
  const { data, isLoading, isError, error } = useCollectionValues(typeCode);
  const [addOpen, setAddOpen] = useState(false);
  const optionError = isError
    ? formatApiError(error, { resource: `${label} options` })
    : null;

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {isLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <select
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select...</option>
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
        <p className="text-xs text-muted-foreground">No options in this collection yet.</p>
      ) : null}
      {allowAdd ? (
        <>
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={() => setAddOpen(true)}
          >
            + Add new option
          </button>
          <AddLookupModal
            typeCode={typeCode}
            open={addOpen}
            onOpenChange={setAddOpen}
            adminKey={adminKey}
          />
        </>
      ) : null}
    </div>
  );
}
