"use client";

import { formRadioPillClass } from "@/renderer/form-styles";
import { cn } from "@/lib/utils";

type RadioPillsProps = {
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  className?: string;
};

export function RadioPills({
  name,
  value,
  options,
  onChange,
  className,
}: RadioPillsProps) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              className="sr-only"
              onChange={() => onChange(option.value)}
            />
            <span className={formRadioPillClass(selected)}>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
