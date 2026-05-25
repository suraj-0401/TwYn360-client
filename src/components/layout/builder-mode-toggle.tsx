"use client";

import { cn } from "@/lib/utils";

type BuilderModeToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  variant?: "default" | "document" | "platform";
};

export function BuilderModeToggle({
  enabled,
  onChange,
  disabled,
  variant = "default",
}: BuilderModeToggleProps) {
  const isDark = variant === "document" || variant === "platform";

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-full p-0.5 text-xs font-medium",
        isDark
          ? "border border-white/[0.05] bg-white/[0.02]"
          : "border bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800",
        disabled && "opacity-50",
      )}
      role="group"
      aria-label="Form mode"
    >
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "rounded-full px-3 py-1 transition-all duration-150",
          !enabled &&
            (isDark
              ? "bg-white/[0.1] text-[#f4f4f5]"
              : "bg-white shadow-sm dark:bg-zinc-900"),
          enabled &&
            (isDark
              ? "text-[#71717a] hover:text-[#a1a1aa]"
              : "text-muted-foreground"),
        )}
        onClick={() => onChange(false)}
      >
        View
      </button>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "rounded-full px-3 py-1 transition-all duration-150",
          enabled &&
            (isDark
              ? "bg-white/[0.1] text-[#f4f4f5]"
              : "bg-white shadow-sm dark:bg-zinc-900"),
          !enabled &&
            (isDark
              ? "text-[#71717a] hover:text-[#a1a1aa]"
              : "text-muted-foreground"),
        )}
        onClick={() => onChange(true)}
      >
        Edit layout
      </button>
    </div>
  );
}
