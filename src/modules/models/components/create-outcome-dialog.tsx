"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { Button } from "@/components/ui/button";
import { OutcomeForm } from "./outcome-form";
import type { OutcomeCreatePayload } from "../utils/outcome-workspace-values";

const CREATE_FORM_ID = "create-outcome-form";

type CreateOutcomeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: OutcomeCreatePayload) => Promise<void>;
  isSubmitting?: boolean;
};

export function CreateOutcomeDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateOutcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col border-white/10 bg-[#121214] text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create outcome</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Outcomes are predicted targets (e.g. tumor volume, response rate). Each outcome can
            have its own formula model.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-1">
          <OutcomeForm
            mode="create"
            formId={CREATE_FORM_ID}
            hideSubmitButton
            layout="dialog"
            onSubmit={async (payload) => {
              await onSubmit(payload as OutcomeCreatePayload);
            }}
          />
        </div>

        <DialogFooter className="border-white/10 bg-[#0f0f11]">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-transparent text-zinc-200"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form={CREATE_FORM_ID}
            loading={isSubmitting}
          >
            Create outcome
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
