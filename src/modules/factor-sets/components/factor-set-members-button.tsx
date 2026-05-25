"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FactorSetMembersButtonProps = {
  memberCount: number;
  onClick: () => void;
  disabled?: boolean;
};

export function FactorSetMembersButton({
  memberCount,
  onClick,
  disabled,
}: FactorSetMembersButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04] hover:text-[#f4f4f5]",
      )}
    >
      <Users className="size-4" />
      Members
      <span className="tabular-nums text-[#71717a]">({memberCount})</span>
    </Button>
  );
}
