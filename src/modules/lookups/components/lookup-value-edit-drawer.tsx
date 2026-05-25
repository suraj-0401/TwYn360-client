"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { platform } from "@/styles/tokens";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { updateCollectionValue } from "@/services/lookup-collection.service";
import { createLookupCollectionValue } from "../utils/lookup-collection-mutations";

export type LookupValueRow = {
  valueId: string;
  code: string;
  label: string;
  isSystem: boolean;
};

type LookupValueEditDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  collectionId: string;
  collectionLabel: string;
  adminKey?: string;
  initial?: LookupValueRow;
  onSuccess: () => void | Promise<void>;
  codesLocked?: boolean;
};

export function LookupValueEditDrawer({
  open,
  onOpenChange,
  mode,
  collectionId,
  collectionLabel,
  adminKey,
  initial,
  onSuccess,
  codesLocked = false,
}: LookupValueEditDrawerProps) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (mode === "edit" && initial) {
      setCode(initial.code);
      setLabel(initial.label);
    } else {
      setCode("");
      setLabel("");
    }
  }, [mode, initial, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!adminKey) {
        throw new Error("Admin API key is required.");
      }
      if (mode === "create") {
        return createLookupCollectionValue(
          collectionId,
          { code: code.trim(), label: label.trim() },
          adminKey,
        );
      }
      if (!initial?.valueId) {
        throw new Error("Missing value id");
      }
      return updateCollectionValue(
        initial.valueId,
        { label: label.trim() },
        adminKey,
      );
    },
    onSuccess: async () => {
      await onSuccess();
      toast.success(mode === "create" ? "Value added" : "Value updated");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "fixed top-0 right-0 left-auto flex h-full max-h-none w-full max-w-md translate-x-0 translate-y-0 flex-col rounded-none border-l border-white/[0.08] bg-[#0c0c0e] p-0 sm:max-w-md",
          "data-open:slide-in-from-right data-closed:slide-out-to-right",
        )}
      >
        <DialogHeader className="border-b border-white/[0.06] px-5 py-4">
          <DialogTitle className="text-[#f4f4f5]">
            {mode === "create" ? "Add value" : "Edit value"}
          </DialogTitle>
          <DialogDescription className="text-[#71717a]">
            {collectionLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-1">
            <Label className={platform.label}>Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={mode === "edit" || codesLocked}
              placeholder="e.g. pkpd"
              className={platform.input}
            />
            {mode === "edit" ? (
              <p className="text-xs text-[#52525b]">Code cannot be changed.</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label className={platform.label}>Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. PK/PD"
              className={platform.input}
              autoFocus={mode === "edit"}
            />
          </div>
        </div>

        <DialogFooter className="border-t border-white/[0.06] bg-[#0a0a0a] px-5 py-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10"
          >
            Cancel
          </Button>
          <LoadingButton
            loading={saveMutation.isPending}
            loadingText="Saving…"
            disabled={!label.trim() || (mode === "create" && !code.trim())}
            onClick={() => saveMutation.mutate()}
            className={platform.primaryButton}
          >
            {mode === "create" ? "Add value" : "Save changes"}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
