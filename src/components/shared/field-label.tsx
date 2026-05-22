"use client";

import { TooltipInfoTrigger } from "@/components/ui/tooltip";
import { formLabelClass } from "@/renderer/form-styles";
import { cn } from "@/lib/utils";

type FieldLabelProps = {
  htmlFor?: string;
  label: string;
  required?: boolean;
  tooltip?: string | null;
  className?: string;
};

export function FieldLabel({
  htmlFor,
  label,
  required,
  tooltip,
  className,
}: FieldLabelProps) {
  const hint = tooltip?.trim();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor={htmlFor} className={formLabelClass}>
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </label>
      {hint ? <TooltipInfoTrigger label={hint} side="top" /> : null}
    </div>
  );
}
