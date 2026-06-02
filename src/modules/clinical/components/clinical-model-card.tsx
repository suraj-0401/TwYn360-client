"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ClinicalModelCardProps = {
  id: string;
  displayName: string;
  drugDisplayName?: string | null;
  variant?: "featured" | "compact";
};

export function ClinicalModelCard({
  id,
  displayName,
  drugDisplayName,
  variant = "compact",
}: ClinicalModelCardProps) {
  const isFeatured = variant === "featured";

  return (
    <Link
      href={`/clinical/models/${id}/assess`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-white/[0.08]",
        "bg-gradient-to-br from-[#0e1218] via-[#0a0c10] to-[#080a0e]",
        "transition-all duration-200",
        "hover:border-emerald-500/30 hover:shadow-[0_0_40px_-12px_rgba(16,185,129,0.35)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
        isFeatured ? "p-8" : "p-5",
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-emerald-500/[0.07] blur-3xl"
        aria-hidden
      />

      <div className={cn("relative", isFeatured && "max-w-lg")}>
        <div className="flex items-center gap-2 text-emerald-400/80">
          <Sparkles className="size-3.5" aria-hidden />
          <span className="text-[11px] font-medium uppercase tracking-wide">
            Ready to run
          </span>
        </div>

        <h3
          className={cn(
            "mt-3 font-semibold tracking-tight text-zinc-50",
            isFeatured ? "text-2xl leading-tight" : "text-[15px] leading-snug",
          )}
        >
          {displayName}
        </h3>

        {drugDisplayName ? (
          <p
            className={cn(
              "text-zinc-500",
              isFeatured ? "mt-2 text-sm" : "mt-1 text-[12px]",
            )}
          >
            {drugDisplayName}
          </p>
        ) : null}

        <span
          className={cn(
            "mt-6 inline-flex items-center gap-2 rounded-xl font-medium text-white",
            "bg-emerald-600 shadow-lg shadow-emerald-900/30",
            "group-hover:bg-emerald-500",
            isFeatured ? "px-5 py-3 text-sm" : "mt-5 w-full justify-center px-4 py-2.5 text-[12px]",
          )}
        >
          Start clinical assessment
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
