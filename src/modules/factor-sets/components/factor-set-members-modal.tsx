"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FactorSetMembersSection,
  type FactorSetMembersSectionProps,
} from "./factor-set-members-section";

type FactorSetMembersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & FactorSetMembersSectionProps;

function memberCount(props: FactorSetMembersSectionProps): number {
  if (props.mode === "draft") {
    return props.members.length;
  }
  return props.members.length;
}

export function FactorSetMembersModal({
  open,
  onOpenChange,
  ...sectionProps
}: FactorSetMembersModalProps) {
  const count = memberCount(sectionProps);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden border-white/[0.08] bg-[#111113] p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-white/[0.06] px-5 py-4">
          <DialogTitle className="text-[#f4f4f5]">Members</DialogTitle>
          <DialogDescription className="text-[#71717a]">
            Ordered list of registry factors in this set ({count} total). Add,
            remove, and reorder factors here.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <FactorSetMembersSection {...sectionProps} layout="modal" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
