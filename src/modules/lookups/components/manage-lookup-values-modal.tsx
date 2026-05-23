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
import { fetchLookupOptions } from "@/modules/lookups/utils/fetch-lookup-options";
import { removeLookupCollectionValue } from "@/modules/lookups/utils/lookup-collection-mutations";
import { collectionValuesQueryKey } from "../hooks/use-collection-values";
import { lookupQueryKey } from "../hooks/lookup-query-key";

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
  valueId: string;
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

  const valuesQuery = useQuery({
    queryKey: ["lookup-manage", collectionOrTypeCode],
    queryFn: async (): Promise<ManageRow[]> => {
      const items = await fetchLookupOptions(collectionOrTypeCode);
      return items.map((item) => ({
        rowKey: item.valueId,
        valueId: item.valueId,
        code: item.code,
        label: item.label,
      }));
    },
    enabled: open && Boolean(collectionOrTypeCode),
  });

  const removeMutation = useMutation({
    mutationFn: async (row: ManageRow) =>
      removeLookupCollectionValue(collectionOrTypeCode, row, adminKey),
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
    onError: (err: Error) => toast.error(err.message),
  });

  async function handleRemove(row: ManageRow) {
    const ok = await confirm({
      title: "Remove value?",
      description: `Remove "${row.label}" from ${fieldLabel}?`,
      confirmLabel: "Remove",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    removeMutation.mutate(row);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-4" aria-hidden />
            Manage values — {fieldLabel}
          </DialogTitle>
        </DialogHeader>

        {valuesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {valuesQuery.isError ? (
          <p className="text-sm text-red-600">Could not load values.</p>
        ) : null}

        {valuesQuery.data && valuesQuery.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No values in this list.</p>
        ) : null}

        {valuesQuery.data && valuesQuery.data.length > 0 ? (
          <ul className="divide-y rounded-md border">
            {valuesQuery.data.map((row) => (
              <li
                key={row.rowKey}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.code}
                  </p>
                </div>
                {adminKey ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={removeMutation.isPending}
                    onClick={() => void handleRemove(row)}
                    aria-label={`Remove ${row.label}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
