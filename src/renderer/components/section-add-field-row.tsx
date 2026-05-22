"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formGhostButtonClass } from "@/renderer/form-styles";
import { FieldTypePicker } from "./field-type-picker";

type SectionAddFieldRowProps = {
  sectionId: string;
};

/** Add field control at the bottom of each section (edit layout). */
export function SectionAddFieldRow({ sectionId }: SectionAddFieldRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="relative col-span-12 pt-2">
      <button
        type="button"
        className={cn(formGhostButtonClass, "text-[12px]")}
        aria-expanded={pickerOpen}
        onClick={(e) => {
          e.stopPropagation();
          setPickerOpen((v) => !v);
        }}
      >
        Add field
      </button>
      <FieldTypePicker
        sectionId={sectionId}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        anchor="below"
        variant="document"
        className="left-0"
      />
    </div>
  );
}
