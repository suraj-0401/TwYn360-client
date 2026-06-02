import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ClinicalHomePanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function ClinicalHomePanel({
  title,
  children,
  className,
  action,
}: ClinicalHomePanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-[#0a0c10]/80 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-5 py-3.5">
        <h2 className="text-[13px] font-medium text-zinc-200">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
