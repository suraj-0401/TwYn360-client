"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { QueryErrorState } from "@/components/feedback";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { env } from "@/config/env";
import { toast } from "@/lib/toast";
import { lookupCollectionsQueryKey } from "@/modules/lookups/hooks/use-lookup-collections";
import { collectionValuesQueryKey } from "@/modules/lookups/hooks/use-collection-values";
import {
  createCollectionValue,
  listCollectionValues,
  listLookupCollections,
} from "@/services/lookup-collection.service";

export default function LookupsPage() {
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");

  const collectionsQuery = useQuery({
    queryKey: lookupCollectionsQueryKey(),
    queryFn: async () => (await listLookupCollections()).data,
  });

  const valuesQuery = useQuery({
    queryKey: collectionValuesQueryKey(selectedId ?? ""),
    queryFn: async () => {
      if (!selectedId) {
        return [];
      }
      return (await listCollectionValues(selectedId)).data;
    },
    enabled: Boolean(selectedId),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) {
        throw new Error("Select a collection first");
      }
      return createCollectionValue(
        selectedId,
        { code: code.trim(), label: label.trim() },
        adminKey,
      );
    },
    onSuccess: async () => {
      if (selectedId) {
        await queryClient.invalidateQueries({
          queryKey: collectionValuesQueryKey(selectedId),
        });
        await queryClient.invalidateQueries({ queryKey: ["lookup-options"] });
      }
      setCode("");
      setLabel("");
      toast.success("Value added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const selected = collectionsQuery.data?.find((c) => c.id === selectedId);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Lookup collections</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage dropdown options used by workspace lookup fields. Requires admin
          API key to add values.
        </p>
      </div>

      {collectionsQuery.error ? (
        <QueryErrorState
          error={collectionsQuery.error}
          context={{ resource: "lookup collections" }}
          onRetry={() => collectionsQuery.refetch()}
          isRetrying={collectionsQuery.isFetching}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collection</TableHead>
                <TableHead>Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(collectionsQuery.data ?? []).map((collection) => (
                <TableRow
                  key={collection.id}
                  className={
                    selectedId === collection.id ? "bg-muted/50" : undefined
                  }
                  onClick={() => setSelectedId(collection.id)}
                >
                  <TableCell className="cursor-pointer font-medium">
                    {collection.label}
                  </TableCell>
                  <TableCell className="cursor-pointer font-mono text-xs text-muted-foreground">
                    {collection.code}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border bg-card p-4">
          {selected ? (
            <>
              <h2 className="font-medium">{selected.label}</h2>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {selected.id}
              </p>

              {valuesQuery.error ? (
                <div className="mt-4">
                  <QueryErrorState
                    error={valuesQuery.error}
                    context={{ resource: `${selected.label} values` }}
                    onRetry={() => valuesQuery.refetch()}
                    isRetrying={valuesQuery.isFetching}
                  />
                </div>
              ) : (
                <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto text-sm">
                  {(valuesQuery.data ?? []).map((value) => (
                    <li key={value.id} className="flex justify-between gap-2">
                      <span>{value.label}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {value.code}
                      </span>
                    </li>
                  ))}
                  {(valuesQuery.data?.length ?? 0) === 0 ? (
                    <li className="text-muted-foreground">No values yet.</li>
                  ) : null}
                </ul>
              )}

              <div className="mt-6 space-y-3 border-t pt-4">
                <p className="text-sm font-medium">Add value</p>
                {!adminKey ? (
                  <p className="text-xs text-muted-foreground">
                    Set NEXT_PUBLIC_ADMIN_API_KEY to add values.
                  </p>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="value-code">Code</Label>
                      <Input
                        id="value-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="value-label">Label</Label>
                      <Input
                        id="value-label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                      />
                    </div>
                    <LoadingButton
                      loading={addMutation.isPending}
                      loadingText="Adding..."
                      disabled={!code.trim() || !label.trim()}
                      onClick={() => addMutation.mutate()}
                    >
                      Add value
                    </LoadingButton>
                  </>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a collection to view and manage its values.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
