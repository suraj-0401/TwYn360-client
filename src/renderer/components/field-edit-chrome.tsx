"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formFieldEditChromeClass } from "@/renderer/form-styles";
import { useWorkspaceEdit } from "../context/workspace-edit-context";

type FieldEditChromeProps = {
  sectionKey: string;
  fieldKey: string;
  fieldId: string;
  sectionId: string;
  fieldIndex: number;
  fieldCount: number;
  gridClassName?: string;
  disabled?: boolean;
  children: React.ReactNode;
};

export function FieldEditChrome({
  fieldId,
  sectionId,
  fieldIndex,
  fieldCount,
  gridClassName,
  disabled = false,
  children,
}: FieldEditChromeProps) {
  const edit = useWorkspaceEdit();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  if (!edit) {
    return <>{children}</>;
  }

  const selected = edit.selectedFieldId === fieldId;
  const menuItemClass =
    "flex w-full px-3 py-1.5 text-left text-[12px] text-[#e4e4e7] hover:bg-white/[0.06]";

  return (
    <div
      className={cn(
        gridClassName,
        formFieldEditChromeClass(selected),
        "group/field relative px-1 py-1",
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          edit.selectField(fieldId, sectionId);
        }
      }}
      onKeyDown={() => {}}
      role="presentation"
    >
      <div
        ref={menuRef}
        className={cn(
          "absolute -right-1 top-1 z-20 opacity-0 transition-opacity",
          "group-hover/field:opacity-100",
          (selected || menuOpen) && "opacity-100",
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 rounded-full p-0 text-[#a1a1aa] hover:bg-white/[0.06] hover:text-[#e4e4e7]",
            menuOpen && "bg-white/[0.08] text-[#e4e4e7]",
          )}
          aria-label="Field options"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>

        {menuOpen ? (
          <div
            className="absolute right-0 top-full z-50 mt-1 min-w-[9rem] rounded-lg border border-white/[0.08] bg-[#141416] py-1"
            role="menu"
          >
            <button
              type="button"
              className={cn(menuItemClass, "disabled:opacity-40")}
              disabled={fieldIndex === 0}
              role="menuitem"
              onClick={() => {
                edit.moveField(sectionId, fieldId, -1);
                setMenuOpen(false);
              }}
            >
              Move up
            </button>
            <button
              type="button"
              className={cn(menuItemClass, "disabled:opacity-40")}
              disabled={fieldIndex >= fieldCount - 1}
              role="menuitem"
              onClick={() => {
                edit.moveField(sectionId, fieldId, 1);
                setMenuOpen(false);
              }}
            >
              Move down
            </button>
            <button
              type="button"
              className="flex w-full px-3 py-1.5 text-left text-[12px] text-red-400 hover:bg-red-500/10"
              role="menuitem"
              onClick={() => {
                void edit.removeField(fieldId);
                setMenuOpen(false);
              }}
            >
              Delete field
            </button>
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
