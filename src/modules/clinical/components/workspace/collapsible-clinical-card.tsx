"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type CollapsibleClinicalCardProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function CollapsibleClinicalCard({
  title,
  defaultOpen = true,
  children,
}: CollapsibleClinicalCardProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-white/[0.05] bg-[#090b0e]"
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <h3 className="truncate text-[13px] font-medium text-zinc-200">{title}</h3>
        <ChevronDown
          className="size-4 shrink-0 text-zinc-600 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-white/[0.04] px-3 py-3">{children}</div>
    </details>
  );
}
