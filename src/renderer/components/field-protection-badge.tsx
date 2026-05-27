"use client";

import { cn } from "@/lib/utils";
import {
  FIELD_PROTECTION_LEVEL,
  PROTECTION_BADGE_LABEL,
  type FieldProtectionLevel,
} from "@/config/field-protection";

type FieldProtectionBadgeProps = {
  protection: FieldProtectionLevel;
  className?: string;
};

const BADGE_STYLES: Record<FieldProtectionLevel, string> = {
  [FIELD_PROTECTION_LEVEL.SYSTEM]:
    "border-amber-500/35 bg-amber-500/10 text-amber-200/90",
  [FIELD_PROTECTION_LEVEL.CORE]:
    "border-sky-500/35 bg-sky-500/10 text-sky-200/90",
  [FIELD_PROTECTION_LEVEL.CUSTOM]:
    "border-white/10 bg-white/[0.04] text-[#a1a1aa]",
};

export function FieldProtectionBadge({
  protection,
  className,
}: FieldProtectionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        BADGE_STYLES[protection],
        className,
      )}
      title={`Field protection: ${protection}`}
    >
      {PROTECTION_BADGE_LABEL[protection]}
    </span>
  );
}
