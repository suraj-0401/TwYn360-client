import { cn } from "@/lib/utils";

/** Shared document surface — keep layers close in tone. */
export const formSurfaceBg = "bg-[#0a0a0a]";
export const formSurfaceBorder = "border-white/[0.04]";
export const formControlBg = "bg-white/[0.02]";
export const formControlBorder = "border-white/[0.05]";

/** Page shell — view and edit share one system. */
export const formPageClass = cn(
  "form-shell min-h-full font-sans text-[13px] text-[#e4e4e7]",
  formSurfaceBg,
);

/** Sections: outline only, no heavy card fill. */
export const formSectionClass = cn(
  "rounded-xl border bg-transparent",
  formSurfaceBorder,
  "transition-[border-color] duration-150",
);

export const formSectionSelectedClass = "border-white/[0.08]";

export const formSectionGapClass = "flex flex-col gap-5";

export const formSectionHeaderClass = "mb-4";

export const formSectionTitleClass =
  "font-sans text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[#f4f4f5]";

export const formSectionDescriptionClass =
  "mt-1 max-w-lg font-sans text-[12px] leading-normal text-[#a1a1aa]";

export const formSectionTitleInputClass = cn(
  formSectionTitleClass,
  "w-full max-w-3xl rounded-md border border-transparent bg-transparent px-0 py-0",
  "placeholder:text-[#71717a]",
  "hover:border-white/[0.06]",
  "focus-visible:border-white/[0.1] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/[0.06]",
);

export const formSectionDescriptionInputClass = cn(
  "w-full max-w-lg font-sans text-[12px] leading-normal text-[#a1a1aa]",
  "rounded-md border border-transparent bg-transparent px-0 py-0.5",
  "placeholder:text-[#71717a]",
  "hover:border-white/[0.06]",
  "focus-visible:border-white/[0.1] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/[0.06]",
);

/** Label → control rhythm (4px). */
export const formFieldStackClass = "flex min-w-0 flex-col gap-1";

export const formLabelClass =
  "font-sans text-[12px] font-medium leading-none text-[#d4d4d8]";

export const formInputClass = cn(
  "h-9 w-full min-w-0 rounded-lg border px-3",
  formControlBorder,
  formControlBg,
  "font-sans text-[13px] leading-normal text-[#f4f4f5]",
  "transition-[border-color,background-color] duration-150 ease-out outline-none",
  "placeholder:text-[#52525b]",
  "hover:border-white/[0.08] hover:bg-white/[0.03]",
  "focus-visible:border-white/[0.12] focus-visible:bg-white/[0.03] focus-visible:ring-1 focus-visible:ring-white/[0.05]",
  "disabled:pointer-events-none disabled:opacity-45",
);

export const formTextareaClass = cn(
  formInputClass,
  "h-auto min-h-[64px] max-h-[180px] resize-y py-2 leading-normal",
);

export const formSelectClass = cn(formInputClass, "appearance-none pr-8");

export const formHelperClass = cn(
  "font-sans text-[11px] leading-snug text-[#71717a]",
  "opacity-0 transition-opacity duration-150",
  "group-focus-within:opacity-100 group-hover:opacity-100",
);

export const formRadioPillClass = (selected: boolean) =>
  cn(
    "inline-flex h-8 min-h-8 items-center justify-center rounded-lg border px-3",
    "font-sans text-[12px] font-medium transition-[border-color,background-color] duration-150",
    selected
      ? "border-white/[0.12] bg-white/[0.08] text-[#f4f4f5]"
      : cn(
          formControlBorder,
          formControlBg,
          "text-[#a1a1aa] hover:border-white/[0.08] hover:bg-white/[0.04]",
        ),
  );

export const formRatingSegmentClass = (selected: boolean) =>
  cn(
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
    "font-sans text-[12px] font-medium tabular-nums transition-[border-color,background-color] duration-150",
    selected
      ? "border-white/[0.14] bg-white/[0.1] text-[#f4f4f5]"
      : cn(
          formControlBorder,
          formControlBg,
          "text-[#a1a1aa] hover:border-white/[0.08] hover:bg-white/[0.04]",
        ),
  );

export const formPrimaryButtonClass = cn(
  "inline-flex h-8 items-center justify-center rounded-lg px-4",
  "font-sans text-[13px] font-medium",
  "border border-white/[0.14] bg-white/[0.92] text-[#18181b]",
  "transition-colors duration-150",
  "hover:bg-white disabled:pointer-events-none disabled:opacity-45",
);

export const formGhostButtonClass = cn(
  "inline-flex h-8 items-center gap-1.5 rounded-lg border bg-transparent px-3",
  formControlBorder,
  "font-sans text-[12px] font-medium text-[#d4d4d8] transition-colors duration-150",
  "hover:border-white/[0.08] hover:bg-white/[0.03]",
);

export const formFieldEditChromeClass = (selected: boolean) =>
  cn(
    "rounded-lg transition-colors duration-150",
    selected
      ? "bg-white/[0.02] outline outline-1 outline-offset-0 outline-white/[0.07]"
      : "hover:bg-white/[0.015]",
);
