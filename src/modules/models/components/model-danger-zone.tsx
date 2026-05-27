"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/feedback";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canPermanentDeleteByLifecycle } from "@/config/governance";
import {
  LIFECYCLE_STATUS,
  isArchivedLifecycle,
  isDeletedLifecycle,
} from "@/config/lifecycle";
import {
  MUTATION_ACTION_LABEL,
  MUTATION_HELP_COPY,
  MUTATION_SUCCESS_MESSAGE,
  mutationConfirm,
} from "@/config/mutation-labels";
import { getErrorMessage } from "@/lib/api-error";
import { toast } from "@/lib/toast";
import {
  archiveModel,
  permanentDeleteModel,
  updateModel,
} from "@/services/model.service";
import type { ModelDto } from "@/types/model";

type ModelDangerZoneProps = {
  model: ModelDto;
};

export function ModelDangerZone({ model }: ModelDangerZoneProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const isDraft = model.statusCode === LIFECYCLE_STATUS.DRAFT;
  const isActive = model.statusCode === LIFECYCLE_STATUS.ACTIVE;
  const isArchived = isArchivedLifecycle(model.statusCode);
  const isDeleted = isDeletedLifecycle(model.statusCode);

  const canPermanentDelete =
    !isDeleted && canPermanentDeleteByLifecycle(model.statusCode);

  async function runAction(
    action: string,
    fn: () => Promise<unknown>,
    successMessage: string,
    redirect = "/models",
  ): Promise<void> {
    setLoading(action);
    try {
      await fn();
      toast.success(successMessage);
      router.push(redirect);
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  }

  async function handleArchive() {
    const ok = await confirm(mutationConfirm.archiveWorkspace());
    if (!ok) {
      return;
    }
    await runAction(
      "archive",
      () => archiveModel(model.id),
      MUTATION_SUCCESS_MESSAGE.workspaceArchived,
    );
  }

  async function handleRestore() {
    const ok = await confirm(mutationConfirm.restoreWorkspace());
    if (!ok) {
      return;
    }
    await runAction(
      "restore",
      () =>
        updateModel(model.id, {
          statusCode: LIFECYCLE_STATUS.ACTIVE,
          expectedVersion: model.version,
        }),
      MUTATION_SUCCESS_MESSAGE.workspaceRestored,
      `/models/${model.id}/edit`,
    );
  }

  async function handlePermanentDelete() {
    const ok = await confirm(
      mutationConfirm.permanentlyRemoveWorkspace(model.displayName),
    );
    if (!ok) {
      return;
    }
    await runAction(
      "permanentRemove",
      () => permanentDeleteModel(model.id, { confirmName }),
      MUTATION_SUCCESS_MESSAGE.workspacePermanentlyRemoved,
    );
  }

  if (isDeleted) {
    return (
      <p className="text-sm text-[#71717a]">
        {MUTATION_HELP_COPY.workspacePermanentlyRemovedReadOnly}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {isActive ? (
        <div className="rounded-md border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm text-sky-100/90">
          <p className="font-medium">Active workspace</p>
          <p className="mt-1 text-sky-100/70">
            {MUTATION_HELP_COPY.activeWorkspaceArchiveFirst}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isDraft || isActive ? (
          <LoadingButton
            type="button"
            variant="outline"
            loading={loading === "archive"}
            loadingText="Archiving…"
            onClick={() => void handleArchive()}
            className="border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04]"
          >
            {MUTATION_ACTION_LABEL.archiveWorkspace}
          </LoadingButton>
        ) : null}
        {isArchived ? (
          <LoadingButton
            type="button"
            variant="outline"
            loading={loading === "restore"}
            loadingText="Restoring…"
            onClick={() => void handleRestore()}
            className="border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04]"
          >
            {MUTATION_ACTION_LABEL.restoreToActive}
          </LoadingButton>
        ) : null}
      </div>

      {canPermanentDelete ? (
        <div className="space-y-3 rounded-md border border-red-500/20 bg-red-500/[0.04] p-4">
          <p className="text-xs text-[#71717a]">
            {MUTATION_HELP_COPY.archiveBeforePermanentRemove}
          </p>
          <Label htmlFor="confirm-model-name">
            {MUTATION_HELP_COPY.confirmNamePrompt(model.name)}
          </Label>
          <Input
            id="confirm-model-name"
            value={confirmName}
            placeholder={model.name}
            onChange={(e) => setConfirmName(e.target.value)}
            className="border-white/10 bg-[#0a0a0a]"
          />
          <LoadingButton
            type="button"
            variant="destructive"
            loading={loading === "permanentRemove"}
            loadingText="Removing…"
            disabled={confirmName !== model.name}
            onClick={() => void handlePermanentDelete()}
          >
            {MUTATION_ACTION_LABEL.permanentlyRemove}
          </LoadingButton>
        </div>
      ) : isActive ? (
        <p className="text-sm text-[#71717a]">
          {MUTATION_HELP_COPY.activeWorkspaceArchiveFirst}
        </p>
      ) : null}
    </div>
  );
}
