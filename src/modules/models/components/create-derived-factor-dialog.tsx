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
import { DerivedFactorForm } from "./derived-factor-form";
import type { DerivedFactorCreatePayload } from "../utils/derived-factor-workspace-values";

const CREATE_FORM_ID = "create-derived-factor-form";

type CreateDerivedFactorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: DerivedFactorCreatePayload) => Promise<void>;
  isSubmitting?: boolean;
};

export function CreateDerivedFactorDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateDerivedFactorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col border-white/10 bg-[#121214] text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create derived factor</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Derived factors are computed from raw model factors (e.g. BMI from weight and
            height). Each can have its own formula.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-1">
          <DerivedFactorForm
            mode="create"
            formId={CREATE_FORM_ID}
            hideSubmitButton
            layout="dialog"
            onSubmit={async (payload) => {
              await onSubmit(payload as DerivedFactorCreatePayload);
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
            Create derived factor
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
