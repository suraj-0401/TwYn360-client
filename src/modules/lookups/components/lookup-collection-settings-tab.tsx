"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useConfirm } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/api-error";
import { deleteLookupCollection } from "@/services/lookup-collection.service";
import type { LookupCollectionOverview } from "@/types/lookup-overview";
import {
  collectionCanDelete,
  formatCollectionInUseMessage,
} from "../utils/format-collection-in-use";
import {
  lookupCollectionOverviewQueryKey,
  lookupCollectionsOverviewQueryKey,
} from "../hooks/use-lookup-collections-overview";
import { collectionUsages } from "../utils/collection-usages";

type LookupCollectionSettingsTabProps = {
  overview: LookupCollectionOverview;
  adminKey?: string;
  onViewUsages: () => void;
};

export function LookupCollectionSettingsTab({
  overview,
  adminKey,
  onViewUsages,
}: LookupCollectionSettingsTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const usages = collectionUsages(overview);
  const inUse = usages.length > 0;
  const isSystem = overview.isSystem;
  const canDelete = collectionCanDelete(overview) && Boolean(adminKey);

  const deleteMutation = useMutation({
    mutationFn: () => deleteLookupCollection(overview.id, adminKey),
    onSuccess: () => {
      const deletedCode = overview.code;
      queryClient.removeQueries({
        queryKey: lookupCollectionOverviewQueryKey(deletedCode),
      });
      toast.success("Collection deleted");
      router.replace("/lookups");
      void queryClient.invalidateQueries({
        queryKey: lookupCollectionsOverviewQueryKey,
        exact: true,
      });
    },
    onError: (err: Error) => toast.error(getErrorMessage(err)),
  });

  async function handleDeleteClick() {
    if (!canDelete) {
      return;
    }
    const ok = await confirm({
      title: `Delete “${overview.label}”?`,
      description:
        "This collection is not used anywhere.\nThis action cannot be undone.",
      confirmLabel: "Delete collection",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    deleteMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <h2 className="text-sm font-medium text-[#f4f4f5]">Collection settings</h2>
        <dl className="mt-4 divide-y divide-white/[0.06] rounded-lg border border-white/[0.06] bg-[#0c0c0e]">
          <SettingsRow label="Name" value={overview.label} />
          <SettingsRow label="Code" value={overview.code} mono />
          <SettingsRow
            label="Values"
            value={String(overview.valueCount)}
          />
          <SettingsRow
            label="Type"
            value={isSystem ? "System" : "Custom"}
          />
        </dl>
      </section>

      <section className="rounded-lg border border-red-500/20 bg-red-500/[0.03]">
        <div className="border-b border-red-500/15 px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-400/90" />
            <h2 className="text-sm font-medium text-red-300/95">Danger zone</h2>
          </div>
          <p className="mt-1 text-xs text-[#71717a]">
            Irreversible actions for this collection.
          </p>
        </div>

        <div className="px-5 py-4">
          {isSystem ? (
            <div className="space-y-3">
              <p className="text-sm text-[#a1a1aa]">
                System collections are required by the platform and cannot be
                deleted.
              </p>
              {inUse ? (
                <ViewUsagesButton onClick={onViewUsages} />
              ) : null}
            </div>
          ) : inUse ? (
            <div className="space-y-4">
              <div className="rounded-md border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
                <p className="text-sm font-medium text-amber-100/90">
                  Cannot delete
                </p>
                <p className="mt-1 text-sm text-[#a1a1aa]">
                  {formatCollectionInUseMessage(overview)}
                </p>
              </div>
              <ViewUsagesButton onClick={onViewUsages} />
              <Button
                type="button"
                variant="outline"
                disabled
                className="border-white/[0.08] text-[#52525b]"
              >
                Delete collection
              </Button>
            </div>
          ) : !adminKey ? (
            <p className="text-sm text-[#71717a]">
              Set NEXT_PUBLIC_ADMIN_API_KEY to delete unused collections.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#71717a]">
                This collection is not used anywhere. Deleting removes all
                values permanently.
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteClick}
                disabled={deleteMutation.isPending}
              >
                Delete collection
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SettingsRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-xs text-[#71717a]">{label}</dt>
      <dd
        className={
          mono
            ? "font-mono text-xs text-[#a1a1aa]"
            : "text-sm text-[#f4f4f5]"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ViewUsagesButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="border-white/[0.1] bg-transparent text-[#e4e4e7] hover:bg-white/[0.04]"
    >
      View usages
    </Button>
  );
}
