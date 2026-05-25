"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/feedback";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryErrorState } from "@/components/feedback";
import { platform } from "@/styles/tokens";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { LookupCollectionOverview } from "@/types/lookup-overview";
import {
  collectionValuesQueryKey,
  useCollectionValues,
} from "../hooks/use-collection-values";
import { lookupCollectionsOverviewQueryKey } from "../hooks/use-lookup-collections-overview";
import { lookupQueryKey } from "../hooks/lookup-query-key";
import { removeLookupCollectionValue } from "../utils/lookup-collection-mutations";
import {
  LookupValueEditDrawer,
  type LookupValueRow,
} from "./lookup-value-edit-drawer";

type LookupCollectionValuesTabProps = {
  overview: LookupCollectionOverview;
  adminKey?: string;
};

export function LookupCollectionValuesTab({
  overview,
  adminKey,
}: LookupCollectionValuesTabProps) {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingRow, setEditingRow] = useState<LookupValueRow | undefined>();

  const valuesQuery = useCollectionValues(overview.id);

  const isLifecycle =
    overview.code === "FACTOR_STATUS" || overview.code === "RECORD_STATUS";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = valuesQuery.data ?? [];
    if (!q) {
      return rows;
    }
    return rows.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q),
    );
  }, [valuesQuery.data, search]);

  async function invalidate() {
    await queryClient.invalidateQueries({
      queryKey: collectionValuesQueryKey(overview.id),
    });
    await queryClient.invalidateQueries({
      queryKey: collectionValuesQueryKey(overview.code),
    });
    await queryClient.invalidateQueries({
      queryKey: lookupQueryKey(overview.code),
    });
    await queryClient.invalidateQueries({
      queryKey: lookupCollectionsOverviewQueryKey,
    });
    await queryClient.invalidateQueries({ queryKey: ["lookup-options"] });
    await queryClient.invalidateQueries({ queryKey: ["models", "field-config"] });
  }

  const removeMutation = useMutation({
    mutationFn: async (row: LookupValueRow) =>
      removeLookupCollectionValue(
        overview.id,
        { valueId: row.valueId, code: row.code },
        adminKey,
      ),
    onSuccess: async () => {
      await invalidate();
      toast.success("Value removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setDrawerMode("create");
    setEditingRow(undefined);
    setDrawerOpen(true);
  }

  function openEdit(row: LookupValueRow) {
    setDrawerMode("edit");
    setEditingRow(row);
    setDrawerOpen(true);
  }

  async function handleRemove(row: LookupValueRow) {
    if (row.isSystem) {
      toast.error("System values cannot be removed.");
      return;
    }
    const ok = await confirm({
      title: "Remove value?",
      description: `Remove "${row.label}" from this collection?`,
      confirmLabel: "Remove",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    removeMutation.mutate(row);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#52525b]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search values…"
            className={cn(platform.input, "pl-9")}
          />
        </div>
        {adminKey ? (
          <Button
            type="button"
            onClick={openCreate}
            className={platform.primaryButton}
          >
            <Plus className="mr-1.5 size-4" />
            Add value
          </Button>
        ) : (
          <p className="text-xs text-[#71717a]">
            Set NEXT_PUBLIC_ADMIN_API_KEY to manage values.
          </p>
        )}
      </div>

      {valuesQuery.error ? (
        <QueryErrorState
          error={valuesQuery.error}
          context={{ resource: "values" }}
          onRetry={() => valuesQuery.refetch()}
          isRetrying={valuesQuery.isFetching}
        />
      ) : null}

      <div className="overflow-hidden rounded-lg border border-white/[0.06]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className={platform.tableHead}>Label</TableHead>
              <TableHead className={platform.tableHead}>Code</TableHead>
              <TableHead className={platform.tableHead}>Status</TableHead>
              <TableHead className={cn(platform.tableHead, "w-12")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow
                key={row.valueId}
                className="border-white/[0.04] hover:bg-white/[0.02]"
              >
                <TableCell className="font-medium text-[#f4f4f5]">
                  {row.label}
                </TableCell>
                <TableCell className="font-mono text-xs text-[#71717a]">
                  {row.code}
                </TableCell>
                <TableCell className="text-xs text-[#52525b]">
                  {row.isSystem ? "System" : "Custom"}
                </TableCell>
                <TableCell>
                  {adminKey ? (
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-[#71717a] hover:text-[#f4f4f5]"
                        onClick={() => openEdit(row)}
                        aria-label={`Edit ${row.label}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {!row.isSystem ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-[#71717a] hover:text-red-400"
                          disabled={removeMutation.isPending}
                          onClick={() => void handleRemove(row)}
                          aria-label={`Remove ${row.label}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!valuesQuery.isLoading && filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-sm text-[#71717a]"
                >
                  {search ? "No values match your search." : "No values yet."}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {isLifecycle ? (
        <p className="text-xs text-[#52525b]">
          Lifecycle codes are fixed. Edit labels only; codes cannot be removed.
        </p>
      ) : null}

      <LookupValueEditDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        collectionId={overview.id}
        collectionLabel={overview.label}
        adminKey={adminKey}
        initial={editingRow}
        onSuccess={invalidate}
        codesLocked={isLifecycle}
      />
    </div>
  );
}
