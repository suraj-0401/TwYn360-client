"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useConfirm } from "@/components/feedback";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LIFECYCLE_STATUS,
  isArchivedLifecycle,
  isDeletedLifecycle,
} from "@/config/lifecycle";
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
    !isDeleted && !isActive && (isDraft || isArchived);

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
    const ok = await confirm({
      title: "Archive this workspace?",
      description:
        "The model will be hidden from new scientific use. Header and factor sets become read-only. You can restore later.",
      confirmLabel: "Archive workspace",
      variant: "default",
    });
    if (!ok) {
      return;
    }
    await runAction(
      "archive",
      () => archiveModel(model.id),
      "Workspace archived",
    );
  }

  async function handleRestore() {
    const ok = await confirm({
      title: "Restore to active?",
      description: "The workspace returns to operational status.",
      confirmLabel: "Restore",
    });
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
      "Workspace restored to active",
      `/models/${model.id}/edit`,
    );
  }

  async function handlePermanentDelete() {
    const ok = await confirm({
      title: `Delete “${model.displayName}”?`,
      description:
        "This workspace is not used by runtime jobs.\nThis marks the model as deleted and cannot be undone.",
      confirmLabel: "Delete permanently",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    await runAction(
      "delete",
      () => permanentDeleteModel(model.id, { confirmName }),
      "Workspace deleted",
    );
  }

  if (isDeleted) {
    return (
      <p className="text-sm text-[#71717a]">
        This workspace is deleted and cannot be changed.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {isActive ? (
        <div className="rounded-md border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm text-sky-100/90">
          <p className="font-medium">Active workspace</p>
          <p className="mt-1 text-sky-100/70">
            Structural changes are locked. Archive before permanent delete.
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
            Archive workspace
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
            Restore to active
          </LoadingButton>
        ) : null}
      </div>

      {canPermanentDelete ? (
        <div className="space-y-3 rounded-md border border-red-500/20 bg-red-500/[0.04] p-4">
          <p className="text-xs text-[#71717a]">
            Permanent delete only when the workspace has no simulations or
            runtime usage. Prefer archive when unsure.
          </p>
          <Label htmlFor="confirm-model-name">
            Type <strong>{model.name}</strong> to delete permanently
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
            loading={loading === "delete"}
            loadingText="Deleting…"
            disabled={confirmName !== model.name}
            onClick={() => void handlePermanentDelete()}
          >
            Delete permanently
          </LoadingButton>
        </div>
      ) : isActive ? (
        <p className="text-sm text-[#71717a]">
          Archive this workspace before permanent delete.
        </p>
      ) : null}
    </div>
  );
}
