"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useConfirm } from "@/components/feedback";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/api-error";
import {
  ENTITY_TYPE,
  isArchivedLifecycle,
  isDeletedLifecycle,
} from "@/config/platform";
import {
  listCategoryDrugs,
  permanentDeleteCategory,
} from "@/services/category.service";
import { archiveEntityRecord } from "@/services/entity-record.service";
import type { EntityRecordDto } from "@/types/entity-record";

type CategoryDangerZoneProps = {
  category: EntityRecordDto;
};

function categoryDisplayName(category: EntityRecordDto): string {
  const name = category.values.name;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }
  return category.displayName ?? category.slug ?? category.id;
}

export function CategoryDangerZone({ category }: CategoryDangerZoneProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const displayName = categoryDisplayName(category);
  const isArchived = isArchivedLifecycle(category.status);
  const isDeleted = isDeletedLifecycle(category.status);

  const { data: linkedDrugs } = useQuery({
    queryKey: ["category-drugs", category.id],
    queryFn: async () => {
      const response = await listCategoryDrugs(category.id, { limit: 50 });
      return response.data;
    },
    staleTime: 60_000,
  });

  const activeDrugCount = linkedDrugs?.count ?? 0;
  const blockedByDrugs = activeDrugCount > 0;

  async function runAction(
    action: string,
    fn: () => Promise<unknown>,
    successMessage: string,
  ): Promise<void> {
    setLoading(action);
    try {
      await fn();
      toast.success(successMessage);
      router.push("/categories");
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  }

  async function handleArchive() {
    const ok = await confirm({
      title: "Archive this category?",
      description:
        "It will be hidden from new drug dropdowns. Existing drugs keep their category link.",
      confirmLabel: "Archive",
    });
    if (!ok) {
      return;
    }
    await runAction(
      "archive",
      () => archiveEntityRecord(ENTITY_TYPE.CATEGORY, category.id),
      "Category archived",
    );
  }

  async function handlePermanentDelete() {
    const ok = await confirm({
      title: "Permanently delete this category?",
      description:
        "This cannot be undone. The record is kept for audit only. Active drugs must be reassigned first.",
      confirmLabel: "Delete permanently",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    await runAction(
      "delete",
      () => permanentDeleteCategory(category.id, { confirmName }),
      "Category deleted",
    );
  }

  return (
    <Card className="border-red-200 dark:border-red-900">
      <CardHeader>
        <CardTitle className="text-red-700 dark:text-red-400">
          Danger zone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {blockedByDrugs ? (
          <div
            className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            role="alert"
          >
            <p className="font-medium">Permanent delete is blocked</p>
            <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
              This category is used by {activeDrugCount} active drug
              {activeDrugCount === 1 ? "" : "s"}
              {linkedDrugs?.items.length
                ? `: ${linkedDrugs.items.map((drug) => drug.name).join(", ")}`
                : ""}
              . Archive instead; existing drugs stay readable.
            </p>
            {linkedDrugs?.items.length ? (
              <ul className="mt-2 space-y-1">
                {linkedDrugs.items.map((drug) => (
                  <li key={drug.id}>
                    <Link
                      href={`/drugs/${drug.id}/edit`}
                      className="underline underline-offset-2"
                    >
                      Edit {drug.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {!isDeleted ? (
          <div className="flex flex-wrap gap-2">
            {!isArchived ? (
              <LoadingButton
                type="button"
                variant="outline"
                loading={loading === "archive"}
                loadingText="Archiving..."
                onClick={() => void handleArchive()}
              >
                Archive
              </LoadingButton>
            ) : null}
          </div>
        ) : null}

        {!isDeleted && !isArchived ? (
          <div className="space-y-2 rounded-md border border-red-200 p-4 dark:border-red-900">
            <p className="text-xs text-muted-foreground">
              Use <strong>Archive</strong> when possible. Permanent delete only
              when no active drugs reference this category.
            </p>
            <Label htmlFor="confirm-category-name">
              Type <strong>{displayName}</strong> to delete permanently
            </Label>
            <Input
              id="confirm-category-name"
              value={confirmName}
              placeholder={displayName}
              onChange={(e) => setConfirmName(e.target.value)}
            />
            <LoadingButton
              type="button"
              variant="destructive"
              loading={loading === "delete"}
              loadingText="Deleting..."
              disabled={blockedByDrugs || confirmName !== displayName}
              onClick={() => void handlePermanentDelete()}
            >
              Permanent delete
            </LoadingButton>
          </div>
        ) : isDeleted ? (
          <p className="text-sm text-muted-foreground">
            This category is deleted and cannot be changed.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
