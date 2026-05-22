"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuilderTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useWorkspaceEdit } from "../context/workspace-edit-context";

type SectionHeaderMenuProps = {
  sectionId: string;
  sectionIndex: number;
  sectionCount: number;
};

export function SectionHeaderMenu({
  sectionId,
  sectionIndex,
  sectionCount,
}: SectionHeaderMenuProps) {
  const edit = useWorkspaceEdit();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setMoveOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  if (!edit) {
    return null;
  }

  const menuItemClass =
    "flex w-full px-4 py-2 text-left text-[13px] text-[#e4e4e7] hover:bg-white/[0.06]";

  return (
    <div
      ref={ref}
      className="relative shrink-0"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <BuilderTooltip label="Section options">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 rounded-full p-0 text-[#a1a1aa] hover:bg-white/[0.06] hover:text-[#e4e4e7]",
            menuOpen && "bg-white/[0.08] text-[#e4e4e7]",
          )}
          aria-label="Section options"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((v) => !v);
            setMoveOpen(false);
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </BuilderTooltip>

      {menuOpen ? (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-white/[0.08] bg-[#141416] py-1"
          role="menu"
        >
          <button
            type="button"
            className={menuItemClass}
            role="menuitem"
            onClick={() => {
              edit.duplicateSection(sectionId);
              setMenuOpen(false);
            }}
          >
            Duplicate section
          </button>
          <div className="relative">
            <button
              type="button"
              className={menuItemClass}
              role="menuitem"
              onClick={() => setMoveOpen((v) => !v)}
            >
              Move section
            </button>
            {moveOpen ? (
              <div className="border-t border-white/[0.06] py-1">
                <button
                  type="button"
                  className={cn(menuItemClass, "disabled:opacity-40")}
                  disabled={sectionIndex === 0}
                  onClick={() => {
                    edit.moveSection(sectionId, -1);
                    setMenuOpen(false);
                    setMoveOpen(false);
                  }}
                >
                  Move up
                </button>
                <button
                  type="button"
                  className={cn(menuItemClass, "disabled:opacity-40")}
                  disabled={sectionIndex >= sectionCount - 1}
                  onClick={() => {
                    edit.moveSection(sectionId, 1);
                    setMenuOpen(false);
                    setMoveOpen(false);
                  }}
                >
                  Move down
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="flex w-full px-4 py-2 text-left text-[13px] text-red-400 hover:bg-red-500/10"
            role="menuitem"
            onClick={() => {
              edit.removeSection(sectionId);
              setMenuOpen(false);
            }}
          >
            Delete section
          </button>
        </div>
      ) : null}
    </div>
  );
}
