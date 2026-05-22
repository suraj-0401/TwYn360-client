"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { isLookupCollectionUuid } from "@/renderer/lookup-field.metadata";
import {
  deleteCollectionValue,
  listCollectionValues,
} from "@/services/lookup-collection.service";
import { archiveLookupValue, getLookupValues } from "@/services/lookup.service";
import { collectionValuesQueryKey } from "../hooks/use-collection-values";
import { lookupQueryKey } from "../hooks/use-lookups";

type ManageLookupValuesModalProps = {
  collectionOrTypeCode: string;
  fieldLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminKey?: string;
  selectedCode?: string;
  onSelectedCodeChange?: (code: string) => void;
};

type ManageRow = {
  rowKey: string;
  valueId?: string;
  code: string;
  label: string;
};

export function ManageLookupValuesModal({
  collectionOrTypeCode,
  fieldLabel,
  open,
  onOpenChange,
  adminKey,
  selectedCode,
  onSelectedCodeChange,
}: ManageLookupValuesModalProps) {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const isCollection = isLookupCollectionUuid(collectionOrTypeCode);

  const valuesQuery = useQuery({
    queryKey: ["lookup-manage", collectionOrTypeCode],
    queryFn: async (): Promise<ManageRow[]> => {
      if (isCollection) {
        const response = await listCollectionValues(collectionOrTypeCode);
        return response.data.map((item) => ({
          rowKey: item.id,
          valueId: item.id,
          code: item.code,
          label: item.label,
        }));
      }
      const response = await getLookupValues(collectionOrTypeCode);
      return response.data.map((item) => ({
        rowKey: item.code,
        code: item.code,
        label: item.label,
      }));
    },
    enabled: open && Boolean(collectionOrTypeCode),
  });

  const removeMutation = useMutation({
    mutationFn: async (row: ManageRow) => {
      if (!adminKey) {
        throw new Error("Admin API key is required to remove values.");
      }
      if (isCollection && row.valueId) {
        return deleteCollectionValue(row.valueId, adminKey);
      }
      return archiveLookupValue(collectionOrTypeCode, row.code, adminKey);
    },
    onSuccess: async (_res, row) => {
      await queryClient.invalidateQueries({
        queryKey: collectionValuesQueryKey(collectionOrTypeCode),
      });
      await queryClient.invalidateQueries({
        queryKey: lookupQueryKey(collectionOrTypeCode),
      });
      await queryClient.invalidateQueries({
        queryKey: ["lookup-manage", collectionOrTypeCode],
      });
      if (selectedCode === row.code) {
        onSelectedCodeChange?.("");
      }
      toast.success("Value removed");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  async function handleRemove(row: ManageRow) {
    const ok = await confirm({
      title: "Remove this option?",
      description: `"${row.label}" (${row.code}) will be removed from this list. Existing records that already use this code are not changed.`,
      variant: "destructive",
      confirmLabel: "Remove",
    });
    if (!ok) {
      return;
    }
    removeMutation.mutate(row);
  }

  const rows = valuesQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-4" aria-hidden />
            Manage values
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {fieldLabel} — remove options that were added by mistake.
          </p>
        </DialogHeader>

        {!adminKey ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Set NEXT_PUBLIC_ADMIN_API_KEY in client/.env to match dff-service
            ADMIN_API_KEY, then restart the dev server.
          </p>
        ) : null}

        {valuesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading values…</p>
        ) : null}

        {valuesQuery.error ? (
          <p className="text-sm text-destructive">
            {valuesQuery.error instanceof Error
              ? valuesQuery.error.message
              : "Failed to load values"}
          </p>
        ) : null}

        {!valuesQuery.isLoading && !valuesQuery.error ? (
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-1">
            {rows.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                No values in this collection yet.
              </li>
            ) : (
              rows.map((row) => (
                <li
                  key={row.rowKey}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.label}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {row.code}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={!adminKey || removeMutation.isPending}
                    aria-label={`Remove ${row.label}`}
                    onClick={() => void handleRemove(row)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))
            )}
          </ul>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
