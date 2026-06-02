"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClinicalValue } from "@/modules/clinical/utils/format-clinical-value";
import { shortenOutcomeLabel } from "@/modules/clinical/utils/shorten-display-label";

type OutputMetricCardProps = {
  label: string;
  unitCode: string | null;
  unitDisplayLabel: string | null;
  value: number | null;
  runtimeReady?: boolean;
  isRunning?: boolean;
  variant?: "primary" | "secondary";
};

export function OutputMetricCard({
  label,
  unitCode,
  unitDisplayLabel,
  value,
  runtimeReady = true,
  isRunning = false,
  variant = "secondary",
}: OutputMetricCardProps) {
  let valueNode: ReactNode = (
    <span className="font-mono text-base text-zinc-600">—</span>
  );

  if (!runtimeReady) {
    valueNode = <span className="text-[11px] text-zinc-600">—</span>;
  } else if (isRunning && value === null) {
    valueNode = <Loader2 className="size-4 animate-spin text-emerald-400/70" />;
  } else if (value !== null && !Number.isNaN(value)) {
    valueNode = (
      <span
        className={cn(
          "font-mono font-medium tabular-nums text-zinc-50",
          variant === "primary" ? "text-xl" : "text-base",
        )}
      >
        {formatClinicalValue(value, unitCode, unitDisplayLabel)}
      </span>
    );
  }

  return (
    <article
      className={cn(
        "rounded-md px-2.5 py-2",
        variant === "primary"
          ? "bg-emerald-500/[0.08] ring-1 ring-emerald-500/15"
          : "bg-white/[0.02]",
      )}
    >
      <p className="text-[11px] leading-snug text-zinc-400">
        {shortenOutcomeLabel(label)}
      </p>
      <div className="mt-1">{valueNode}</div>
    </article>
  );
}
