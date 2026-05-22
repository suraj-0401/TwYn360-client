"use client";

import { Plus } from "lucide-react";
import { formGhostButtonClass } from "@/renderer/form-styles";
import { useWorkspaceEdit } from "../context/workspace-edit-context";

type AddSectionInsertProps = {
  afterIndex?: number;
};

export function AddSectionInsert({ afterIndex }: AddSectionInsertProps) {
  const edit = useWorkspaceEdit();
  if (!edit) {
    return null;
  }

  const lastIndex = edit.sections.length - 1;

  return (
    <div className="flex justify-center py-4">
      <button
        type="button"
        className={formGhostButtonClass}
        onClick={() =>
          afterIndex === undefined
            ? edit.addSectionAt(edit.sections.length)
            : edit.addSectionAfter(lastIndex)
        }
      >
        <Plus className="h-4 w-4" />
        Add section
      </button>
    </div>
  );
}
