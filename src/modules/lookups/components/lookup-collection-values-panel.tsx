"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { useConfirm } from "@/components/feedback";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { QueryErrorState } from "@/components/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";
import {
  collectionValuesQueryKey,
  useCollectionValues,
} from "../hooks/use-collection-values";
import { lookupQueryKey } from "../hooks/lookup-query-key";
import { createLookupCollectionValue } from "../utils/lookup-collection-mutations";
import { removeLookupCollectionValue } from "../utils/lookup-collection-mutations";
import {
  updateCollectionValue,
  type LookupCollection,
} from "@/services/lookup-collection.service";

type LookupCollectionValuesPanelProps = {
  collection: LookupCollection;
  adminKey?: string;
};

export function LookupCollectionValuesPanel({
  collection,
  adminKey,
}: LookupCollectionValuesPanelProps) {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const valuesQuery = useCollectionValues(collection.id);

  useEffect(() => {
    setEditingId(null);
    setCode("");
    setLabel("");
  }, [collection.id]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: collectionValuesQueryKey(collection.id),
    });
    await queryClient.invalidateQueries({
      queryKey: collectionValuesQueryKey(collection.code),
    });
    await queryClient.invalidateQueries({
      queryKey: lookupQueryKey(collection.code),
    });
    await queryClient.invalidateQueries({ queryKey: ["lookup-options"] });
    await queryClient.invalidateQueries({ queryKey: ["models", "field-config"] });
  };

  const addMutation = useMutation({
    mutationFn: async () =>
      createLookupCollectionValue(
        collection.id,
        { code: code.trim(), label: label.trim() },
        adminKey,
      ),
    onSuccess: async () => {
      await invalidate();
      setCode("");
      setLabel("");
      toast.success("Value added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      valueId,
      nextLabel,
    }: {
      valueId: string;
      nextLabel: string;
    }) => {
      if (!adminKey) {
        throw new Error("Admin API key is required to edit values.");
      }
      return updateCollectionValue(valueId, { label: nextLabel.trim() }, adminKey);
    },
    onSuccess: async () => {
      await invalidate();
      setEditingId(null);
      toast.success("Value updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (row: {
      valueId: string;
      code: string;
      label: string;
      isSystem: boolean;
    }) => {
      if (row.isSystem) {
        throw new Error("System values cannot be removed.");
      }
      return removeLookupCollectionValue(
        collection.id,
        { valueId: row.valueId, code: row.code },
        adminKey,
      );
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Value removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function handleRemove(row: {
    valueId: string;
    code: string;
    label: string;
    isSystem: boolean;
  }) {
    const ok = await confirm({
      title: "Remove value?",
      description: `Remove "${row.label}" from ${collection.label}?`,
      confirmLabel: "Remove",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    removeMutation.mutate(row);
  }

  const isLifecycleCollection =
    collection.code === "FACTOR_STATUS" ||
    collection.code === "RECORD_STATUS";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-medium text-[#f4f4f5]">{collection.label}</h2>
        <p className="mt-1 font-mono text-xs text-[#52525b]">{collection.code}</p>
        {collection.description ? (
          <p className="mt-2 text-xs text-[#71717a]">{collection.description}</p>
        ) : null}
        {isLifecycleCollection ? (
          <p className="mt-2 text-xs text-amber-600/90 dark:text-amber-400/90">
            Lifecycle codes (draft, active, archived, deleted) are system-defined.
            Labels can be edited; codes cannot be removed.
          </p>
        ) : null}
      </div>

      {valuesQuery.error ? (
        <QueryErrorState
          error={valuesQuery.error}
          context={{ resource: `${collection.label} values` }}
          onRetry={() => valuesQuery.refetch()}
          isRetrying={valuesQuery.isFetching}
        />
      ) : null}

      <ul className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-white/[0.06]">
        {(valuesQuery.data ?? []).map((value) => {
          const isEditing = editingId === value.valueId;
          return (
            <li
              key={value.valueId}
              className="flex items-center justify-between gap-2 border-b border-white/[0.04] px-3 py-2 last:border-0"
            >
              {isEditing ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className={cn(platform.input, "h-8")}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    disabled={updateMutation.isPending || !editLabel.trim()}
                    onClick={() =>
                      updateMutation.mutate({
                        valueId: value.valueId,
                        nextLabel: editLabel,
                      })
                    }
                    aria-label="Save label"
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => setEditingId(null)}
                    aria-label="Cancel edit"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[#f4f4f5]">
                      {value.label}
                      {value.isSystem ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-[#52525b]">
                          system
                        </span>
                      ) : null}
                    </p>
                    <p className="font-mono text-xs text-[#52525b]">{value.code}</p>
                  </div>
                  {adminKey ? (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-[#71717a] hover:text-[#f4f4f5]"
                        onClick={() => {
                          setEditingId(value.valueId);
                          setEditLabel(value.label);
                        }}
                        aria-label={`Edit ${value.label}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {!value.isSystem ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-[#71717a] hover:text-red-400"
                          disabled={removeMutation.isPending}
                          onClick={() => void handleRemove(value)}
                          aria-label={`Remove ${value.label}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </li>
          );
        })}
        {!valuesQuery.isLoading && (valuesQuery.data?.length ?? 0) === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-[#71717a]">
            No values yet.
          </li>
        ) : null}
      </ul>

      {adminKey ? (
        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <p className="text-sm font-medium text-[#f4f4f5]">Add value</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`add-code-${collection.id}`} className={platform.label}>
                Code
              </Label>
              <Input
                id={`add-code-${collection.id}`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. pkpd"
                className={platform.input}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`add-label-${collection.id}`} className={platform.label}>
                Label
              </Label>
              <Input
                id={`add-label-${collection.id}`}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. PK/PD"
                className={platform.input}
              />
            </div>
          </div>
          <LoadingButton
            loading={addMutation.isPending}
            loadingText="Adding…"
            disabled={!code.trim() || !label.trim()}
            onClick={() => addMutation.mutate()}
            className={platform.primaryButton}
          >
            Add value
          </LoadingButton>
        </div>
      ) : (
        <p className="text-xs text-[#71717a]">
          Set NEXT_PUBLIC_ADMIN_API_KEY to add, edit, or remove values.
        </p>
      )}

      {valuesQuery.isError ? null : valuesQuery.isLoading ? (
        <p className="text-xs text-[#71717a]">Loading values…</p>
      ) : null}
    </div>
  );
}
