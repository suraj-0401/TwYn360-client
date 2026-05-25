import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";

type FilterFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
};

export function FilterField({ id, label, children, className }: FilterFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className={platform.label}>
        {label}
      </Label>
      {children}
    </div>
  );
}
