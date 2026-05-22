"use client";

import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CheckSquare,
  CircleDot,
  Heading,
  List,
  ListTree,
  Minus,
  Pilcrow,
  Hash,
  Star,
  Type,
} from "lucide-react";
import { FIELD_TYPE_CATALOG } from "@/renderer/field-metadata.registry";
import type { RendererFieldType } from "@/renderer/types";
import { cn } from "@/lib/utils";
import { useWorkspaceEdit } from "../context/workspace-edit-context";

type FieldTypePickerProps = {
  sectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Anchor to the right of toolbar (Google Forms style). */
  anchor?: "right" | "below";
  variant?: "default" | "document";
  className?: string;
};

const FIELD_ICONS: Partial<Record<RendererFieldType, LucideIcon>> = {
  text: Type,
  textarea: Pilcrow,
  number: Hash,
  select: List,
  dropdown: List,
  radio: CircleDot,
  rating: Star,
  checkbox: CheckSquare,
  date: Calendar,
  lookup: ListTree,
  heading: Heading,
  divider: Minus,
  "dynamic-validations": ListTree,
};

/** Flat groups — no category headings (Google Forms palette). */
const FIELD_GROUPS: RendererFieldType[][] = [
  ["text", "textarea", "number"],
  ["select", "radio", "checkbox", "rating"],
  ["date", "lookup"],
  ["heading", "divider"],
];

export function FieldTypePicker({
  sectionId,
  open,
  onOpenChange,
  anchor = "right",
  variant = "default",
  className,
}: FieldTypePickerProps) {
  const isDocument = variant === "document";
  const edit = useWorkspaceEdit();
  const panelRef = useRef<HTMLDivElement>(null);

  const catalogByType = new Map(
    FIELD_TYPE_CATALOG.map((entry) => [entry.fieldType, entry]),
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onOpenChange]);

  if (!edit || !open) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute z-50 w-52 rounded-lg border py-1.5",
        isDocument
          ? "border-white/[0.08] bg-[#141416]"
          : "border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900",
        anchor === "right"
          ? "left-full top-0 ml-2"
          : "left-0 top-full mt-1.5",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={() => {}}
      role="presentation"
    >
      <p
        className={cn(
          "border-b px-3 py-2 text-[12px] font-medium",
          isDocument
            ? "border-white/[0.06] text-[#e4e4e7]"
            : "border-zinc-100 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200",
        )}
      >
        Add field
      </p>
      {FIELD_GROUPS.map((group, groupIndex) => (
        <div
          key={group.join("-")}
          className={cn(
            groupIndex > 0 &&
              (isDocument
                ? "mt-1 border-t border-white/[0.06] pt-1"
                : "mt-1 border-t border-zinc-100 pt-1 dark:border-zinc-800"),
          )}
        >
          {group.map((fieldType) => {
            const entry = catalogByType.get(fieldType);
            if (!entry) {
              return null;
            }
            const Icon = FIELD_ICONS[fieldType] ?? Type;
            return (
              <button
                key={entry.fieldType}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] transition-colors",
                  isDocument
                    ? "text-[#e4e4e7] hover:bg-white/[0.06]"
                    : "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800",
                )}
                onClick={() => {
                  edit.addPrimitiveToSection(
                    sectionId,
                    entry.fieldType,
                    entry.label,
                  );
                  onOpenChange(false);
                }}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    isDocument
                      ? "bg-white/[0.06] text-[#a1a1aa]"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span>{entry.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
