"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { Info } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider delay={300}>{children}</TooltipPrimitive.Provider>;
}

type BuilderTooltipProps = {
  label: string;
  side?: "top" | "bottom" | "left" | "right";
  children: ReactElement;
};

export function BuilderTooltip({
  label,
  side = "top",
  children,
}: BuilderTooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={6}>
          <TooltipPrimitive.Popup className="z-[200] max-w-xs rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
            {label}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

type TooltipInfoTriggerProps = {
  label: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
};

/** Info icon tooltip trigger — uses span to avoid invalid nested <button> in forms. */
export function TooltipInfoTrigger({
  label,
  side = "top",
  className,
  iconClassName = "h-3.5 w-3.5",
  ariaLabel,
}: TooltipInfoTriggerProps) {
  const hint = label.trim();
  if (!hint) {
    return null;
  }

  return (
    <BuilderTooltip label={hint} side={side}>
      <span
        role="button"
        tabIndex={0}
        className={cn(
          "inline-flex shrink-0 cursor-default rounded-full text-muted-foreground opacity-45 transition-all duration-150 hover:text-foreground hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          className,
        )}
        aria-label={ariaLabel ?? `Help: ${hint}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === " ") {
            e.stopPropagation();
          }
        }}
      >
        <Info className={iconClassName} strokeWidth={2} />
      </span>
    </BuilderTooltip>
  );
}
