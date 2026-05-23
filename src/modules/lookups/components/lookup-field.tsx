"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { FieldLabel } from "@/components/shared/field-label";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formInputClass } from "@/renderer/form-styles";
import { useWorkspaceEdit } from "@/renderer/context/workspace-edit-context";
import { createLookupCollectionValue } from "@/modules/lookups/utils/lookup-collection-mutations";
import {
  collectionValuesQueryKey,
  useCollectionValues,
} from "../hooks/use-collection-values";
import { ManageLookupValuesModal } from "./manage-lookup-values-modal";
import { cn } from "@/lib/utils";

type LookupFieldProps = {
  collectionId: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  allowCreate?: boolean;
  searchable?: boolean;
  asyncLoading?: boolean;
  adminKey?: string;
  placeholder?: string;
  hideLabel?: boolean;
};

function slugCode(label: string): string {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 64) || "value"
  );
}

function stopBuilderBubble(
  edit: ReturnType<typeof useWorkspaceEdit>,
  e: React.SyntheticEvent,
) {
  if (edit) {
    e.stopPropagation();
  }
}

export function LookupField({
  collectionId,
  label,
  value,
  onChange,
  required,
  allowCreate = true,
  searchable: _searchable = true,
  asyncLoading: _asyncLoading = false,
  adminKey,
  placeholder = "Select...",
  hideLabel = false,
}: LookupFieldProps) {
  const edit = useWorkspaceEdit();
  const queryClient = useQueryClient();
  const { data, isLoading } = useCollectionValues(collectionId);
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const options = data ?? [];

  const createMutation = useMutation({
    mutationFn: async (draftLabel: string) => {
      const code = slugCode(draftLabel);
      return createLookupCollectionValue(
        collectionId,
        { code, label: draftLabel.trim() },
        adminKey,
      );
    },
    onSuccess: async (_res, draftLabel) => {
      await queryClient.invalidateQueries({
        queryKey: collectionValuesQueryKey(collectionId),
      });
      const code = slugCode(draftLabel);
      onChange(code);
      setNewLabel("");
      setCreating(false);
      setCreateError(null);
      setOpen(false);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  function handleOpenChange(next: boolean) {
    if (creating && !next) {
      return;
    }
    setOpen(next);
    if (!next) {
      setCreating(false);
      setCreateError(null);
    }
  }

  return (
    <div
      className="space-y-1"
      onClick={(e) => stopBuilderBubble(edit, e)}
      onPointerDown={(e) => stopBuilderBubble(edit, e)}
    >
      {hideLabel ? null : <FieldLabel label={label} required={required} />}
      {isLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <Select
          value={value || null}
          onValueChange={(next) => onChange(next ?? "")}
          open={open}
          onOpenChange={handleOpenChange}
        >
          <SelectTrigger className={cn(formInputClass, "shadow-none")}
            onPointerDown={(e) => stopBuilderBubble(edit, e)}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>

          <SelectContent className="max-h-72 w-(--anchor-width) min-w-[var(--anchor-width)]">
            {creating ? (
              <div
                className="space-y-2 p-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Label className="text-xs">New value label</Label>
                <Input
                  autoFocus
                  value={newLabel}
                  placeholder="Enter label"
                  className="h-8"
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter" && newLabel.trim()) {
                      createMutation.mutate(newLabel);
                    }
                  }}
                />
                {createError ? (
                  <p className="text-xs text-red-600">{createError}</p>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCreating(false);
                      setCreateError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newLabel.trim() || createMutation.isPending}
                    onClick={() => createMutation.mutate(newLabel)}
                  >
                    {createMutation.isPending ? "Creating…" : "Create"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {options.length === 0 ? (
                  <div className="px-3 py-2 text-center text-sm text-muted-foreground">
                    <p className="py-2">No values found</p>
                    <div className="flex flex-col border-t pt-1">
                      {allowCreate ? (
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-xs font-medium text-blue-600 hover:bg-accent dark:text-blue-400"
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => setCreating(true)}
                        >
                          + Create new value
                        </button>
                      ) : null}
                      {adminKey ? (
                        <button
                          type="button"
                          className="flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setOpen(false);
                            setManageOpen(true);
                          }}
                        >
                          <Settings className="size-3.5" aria-hidden />
                          Manage values
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  options.map((item, index) => (
                    <SelectItem
                      key={`${collectionId}-${item.code}-${index}`}
                      value={item.code}
                    >
                      {item.label}
                    </SelectItem>
                  ))
                )}

                {allowCreate || adminKey ? (
                  <>
                    <SelectSeparator key={`${collectionId}-footer-separator`} />
                    <div className="flex flex-col py-0.5">
                      {allowCreate ? (
                        <button
                          key={`${collectionId}-create-trigger`}
                          type="button"
                          className="flex w-full px-3 py-2 text-left text-xs font-medium text-blue-600 hover:bg-accent dark:text-blue-400"
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => setCreating(true)}
                        >
                          + Create new value
                        </button>
                      ) : null}
                      {adminKey ? (
                        <button
                          key={`${collectionId}-manage-trigger`}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setOpen(false);
                            setManageOpen(true);
                          }}
                        >
                          <Settings className="size-3.5 shrink-0" aria-hidden />
                          Manage values
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </>
            )}
          </SelectContent>
        </Select>
      )}

      <ManageLookupValuesModal
        collectionOrTypeCode={collectionId}
        fieldLabel={label}
        open={manageOpen}
        onOpenChange={setManageOpen}
        adminKey={adminKey}
        selectedCode={value}
        onSelectedCodeChange={onChange}
      />
    </div>
  );
}
