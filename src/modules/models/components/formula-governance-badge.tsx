import { StatusBadge } from "@/components/data-table/status-badge";
import { cn } from "@/lib/utils";
import { resolveFormulaPayload } from "@/modules/models/utils/resolve-formula-payload";

type FormulaGovernanceBadgeProps = {
  payload: unknown;
};

export function FormulaGovernanceBadge({ payload }: FormulaGovernanceBadgeProps) {
  const formula = resolveFormulaPayload(payload);

  if (!formula) {
    return <span className="text-xs text-zinc-500">No formula</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge status={formula.status} />
      {formula.status === "approved" ? (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            formula.runtimeReady
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-amber-500/15 text-amber-300",
          )}
        >
          {formula.runtimeReady ? "Runtime ready" : "Not runtime-ready"}
        </span>
      ) : null}
    </div>
  );
}
