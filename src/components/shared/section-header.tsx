"use client";

import { TooltipInfoTrigger } from "@/components/ui/tooltip";
import {
  formSectionDescriptionClass,
  formSectionTitleClass,
} from "@/renderer/form-styles";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  tooltip?: string | null;
  titleClassName?: string;
};

export function SectionHeader({
  title,
  description,
  tooltip,
  titleClassName,
}: SectionHeaderProps) {
  const hint = tooltip?.trim();

  return (
    <div>
      <div className={cn("flex items-center gap-2", titleClassName)}>
        <h2 className={formSectionTitleClass}>{title}</h2>
        {hint ? (
          <TooltipInfoTrigger
            label={hint}
            side="top"
            iconClassName="h-3.5 w-3.5"
            ariaLabel={`Section help: ${hint}`}
          />
        ) : null}
      </div>
      {description?.trim() ? (
        <p className={formSectionDescriptionClass}>{description}</p>
      ) : null}
    </div>
  );
}
