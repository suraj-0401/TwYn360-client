"use client";

import { useState } from "react";
import Link from "next/link";
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
import { getFactorUsageImpact } from "@/services/governance-impact.service";
import {
  isArchivedLifecycle,
  isDeletedLifecycle,
  LIFECYCLE_STATUS,
} from "@/config/lifecycle";
import {
  MUTATION_ACTION_LABEL,
  MUTATION_HELP_COPY,
  MUTATION_SUCCESS_MESSAGE,
  mutationConfirm,
} from "@/config/mutation-labels";
import { useFactorFactorSets } from "@/modules/factors/hooks/use-factor-factor-sets";
import type { Factor } from "@/types/factor";

type FactorDangerZoneProps = {
  factor: Factor;
};

export function FactorDangerZone({ factor }: FactorDangerZoneProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const isArchived = isArchivedLifecycle(factor.statusCode);
  const isDeleted = isDeletedLifecycle(factor.statusCode);

  const { data: factorSets = [] } = useFactorFactorSets(factor.id);
  const activeFactorSets = factorSets.filter(
    (set) => set.statusCode !== LIFECYCLE_STATUS.ARCHIVED,
  );

  const blockedByActiveSets = activeFactorSets.length > 0;
  const blockedByActiveLifecycle =
    !isDeleted && factor.statusCode === LIFECYCLE_STATUS.ACTIVE;

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
    let impact;
    try {
      impact = (await getFactorUsageImpact(factor.id)).data;
    } catch {
      impact = undefined;
    }
    const ok = await confirm(
      mutationConfirm.archiveFactor(blockedByActiveSets, impact),
    );
    if (!ok) {
      return;
    }
    await runAction(
      "archive",
      () => archiveFactor(factor.id),
      MUTATION_SUCCESS_MESSAGE.factorArchived,
    );
  }

  async function handleRestore() {
    const ok = await confirm(mutationConfirm.restoreFactor());
    if (!ok) {
      return;
    }
    await runAction(
      "restore",
      () => restoreFactor(factor.id),
      MUTATION_SUCCESS_MESSAGE.factorRestored,
    );
  }

  async function handlePermanentDelete() {
    let impact;
    try {
      impact = (await getFactorUsageImpact(factor.id)).data;
    } catch {
      impact = undefined;
    }
    const ok = await confirm(mutationConfirm.permanentlyRemoveFactor(impact));
    if (!ok) {
      return;
    }
    await runAction(
      "permanentRemove",
      () => permanentDeleteFactor(factor.id, { confirmName }),
      MUTATION_SUCCESS_MESSAGE.factorPermanentlyRemoved,
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
        {blockedByActiveSets ? (
          <div
            className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            role="alert"
          >
            <p className="font-medium">Permanent removal is blocked</p>
            <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
              {MUTATION_HELP_COPY.factorPermanentRemoveBlocked} Active sets:{" "}
              {activeFactorSets.map((set) => set.displayName).join(", ")}.
            </p>
            <ul className="mt-2 space-y-1">
              {activeFactorSets.map((set) => (
                <li key={set.id}>
                  <Link
                    href={`/factor-sets/${set.id}/edit`}
                    className="underline underline-offset-2"
                  >
                    Edit {set.displayName}
                  </Link>
                </li>
              ))}
            </ul>
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
                {MUTATION_ACTION_LABEL.archiveFactor}
              </LoadingButton>
            ) : (
              <LoadingButton
                type="button"
                variant="outline"
                loading={loading === "restore"}
                loadingText="Restoring..."
                onClick={() => void handleRestore()}
              >
                {MUTATION_ACTION_LABEL.restore}
              </LoadingButton>
            )}
          </div>
        ) : null}

        {blockedByActiveLifecycle ? (
          <div
            className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            role="alert"
          >
            <p className="font-medium">Permanent removal requires archive</p>
            <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
              Archive this factor first. Active factors cannot be permanently
              removed.
            </p>
          </div>
        ) : null}

        {!isDeleted ? (
          <div className="space-y-2 rounded-md border border-red-200 p-4 dark:border-red-900">
            <p className="text-xs text-muted-foreground">
              {MUTATION_HELP_COPY.preferArchive}
            </p>
            <Label htmlFor="confirm-name">
              {MUTATION_HELP_COPY.confirmNamePrompt(factor.name)}
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
              loading={loading === "permanentRemove"}
              loadingText="Removing…"
              disabled={
                blockedByActiveSets ||
                blockedByActiveLifecycle ||
                confirmName !== factor.name
              }
              onClick={() => void handlePermanentDelete()}
            >
              {MUTATION_ACTION_LABEL.permanentlyRemove}
            </LoadingButton>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {MUTATION_HELP_COPY.permanentlyRemovedReadOnly}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
