"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/feedback";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/api-error";
import {
  archiveFactor,
  permanentDeleteFactor,
  restoreFactor,
} from "@/services/factor.service";
import type { Factor } from "@/types/factor";

type FactorDangerZoneProps = {
  factor: Factor;
};

export function FactorDangerZone({ factor }: FactorDangerZoneProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const isArchived = factor.statusCode === "archived";
  const isDeleted = factor.statusCode === "deleted";

  async function runAction(
    action: string,
    fn: () => Promise<unknown>,
    successMessage: string,
  ): Promise<void> {
    setLoading(action);
    try {
      await fn();
      toast.success(successMessage);
      router.push("/factors");
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  }

  async function handleArchive() {
    const ok = await confirm({
      title: "Archive this factor?",
      description: "It will be hidden from the registry. You can restore it later.",
      confirmLabel: "Archive",
      variant: "default",
    });
    if (!ok) {
      return;
    }
    await runAction("archive", () => archiveFactor(factor.id), "Factor archived");
  }

  async function handleRestore() {
    const ok = await confirm({
      title: "Restore this factor?",
      description: "It will return to active status.",
      confirmLabel: "Restore",
    });
    if (!ok) {
      return;
    }
    await runAction("restore", () => restoreFactor(factor.id), "Factor restored");
  }

  async function handlePermanentDelete() {
    const ok = await confirm({
      title: "Permanently delete?",
      description: "This cannot be undone. The record is kept for audit only.",
      confirmLabel: "Delete permanently",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    await runAction(
      "delete",
      () => permanentDeleteFactor(factor.id, { confirmName }),
      "Factor deleted",
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
        {!isDeleted ? (
          <div className="flex flex-wrap gap-2">
            {!isArchived ? (
              <LoadingButton
                type="button"
                variant="outline"
                loading={loading === "archive"}
                loadingText="Archiving..."
                onClick={handleArchive}
              >
                Archive
              </LoadingButton>
            ) : (
              <LoadingButton
                type="button"
                variant="outline"
                loading={loading === "restore"}
                loadingText="Restoring..."
                onClick={handleRestore}
              >
                Restore
              </LoadingButton>
            )}
          </div>
        ) : null}

        {!isDeleted ? (
          <div className="space-y-2 rounded-md border border-red-200 p-4 dark:border-red-900">
            <Label htmlFor="confirm-name">
              Type <strong>{factor.name}</strong> to delete permanently
            </Label>
            <Input
              id="confirm-name"
              value={confirmName}
              placeholder={factor.name}
              onChange={(e) => setConfirmName(e.target.value)}
            />
            <LoadingButton
              type="button"
              variant="destructive"
              loading={loading === "delete"}
              loadingText="Deleting..."
              disabled={confirmName !== factor.name}
              onClick={handlePermanentDelete}
            >
              Permanent delete
            </LoadingButton>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This factor is deleted and cannot be changed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
