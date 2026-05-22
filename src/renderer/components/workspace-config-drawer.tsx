"use client";

import { useMemo } from "react";
import type { WorkspaceSectionRecord } from "@/types/workspace";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { Button } from "@/components/ui/button";
import type { SectionSettingsPatch } from "@/renderer/section-metadata.registry";
import { cn } from "@/lib/utils";
import { updateField } from "@/services/workspace.service";
import type { WorkspaceFieldRecord } from "@/types/workspace";
import { useWorkspaceEdit } from "../context/workspace-edit-context";
import { FieldSettingsRenderer } from "./field-settings-renderer";
import { SectionSettingsPanel } from "./section-settings-panel";

export function WorkspaceConfigDrawer() {
  const edit = useWorkspaceEdit();
  if (!edit?.editEnabled) {
    return null;
  }

  const showFieldSettings = Boolean(edit.selectedFieldId);
  const showSectionSettings =
    Boolean(edit.selectedSectionId) && !edit.selectedFieldId;
  const open = showFieldSettings || showSectionSettings;

  function close() {
    edit?.selectField(null);
    edit?.selectSection(null);
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close configuration"
          className="fixed inset-0 z-40 bg-black/50"
          onClick={close}
        />
      ) : null}

      <aside
        className={cn(
          "fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/[0.04] bg-[#0a0a0a]/98 font-sans text-[#f4f4f5] backdrop-blur-sm transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3">
          <p className="text-sm font-medium text-[#f4f4f5]">
            {showFieldSettings ? "Field" : "Section"}
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={close}>
            ✕
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {showFieldSettings ? (
            <FieldConfigPanel fieldId={edit.selectedFieldId!} />
          ) : showSectionSettings && edit.selectedSectionId ? (
            <SectionConfigPanel
              sectionId={edit.selectedSectionId}
              onDelete={() => edit.removeSection(edit.selectedSectionId!)}
            />
          ) : null}
        </div>

        <div className="border-t border-white/[0.04] p-4">
          <LoadingButton className="w-full" type="button" onClick={() => edit.publishLayout()}>
            Publish layout
          </LoadingButton>
        </div>
      </aside>
    </>
  );
}

function FieldConfigPanel({ fieldId }: { fieldId: string }) {
  const edit = useWorkspaceEdit();

  const field = useMemo((): WorkspaceFieldRecord | null => {
    if (!edit) {
      return null;
    }
    for (const section of edit.sections) {
      const match = section.fields.find((f) => f.id === fieldId);
      if (match) {
        return match;
      }
    }
    return edit.selectedField?.id === fieldId ? edit.selectedField : null;
  }, [edit?.sections, edit?.selectedField, fieldId]);

  if (!edit) {
    return null;
  }

  if (!field) {
    return (
      <p className="text-sm text-muted-foreground">Loading field settings…</p>
    );
  }

  const { debouncedUpdateField, saveWorkspace, adminKey } = edit;

  return (
    <FieldSettingsRenderer
      field={field}
      onPatch={(patch) => debouncedUpdateField(fieldId, patch)}
      onFieldTypeChange={async (nextType) => {
        await saveWorkspace(
          updateField(fieldId, { fieldType: nextType }, adminKey),
          { silent: true },
        );
      }}
      onOptionsSave={async (options) => {
        await saveWorkspace(
          updateField(fieldId, { config: { options } }, adminKey),
          { silent: true },
        );
      }}
    />
  );
}

function SectionConfigPanel({
  sectionId,
  onDelete,
}: {
  sectionId: string;
  onDelete: () => void;
}) {
  const edit = useWorkspaceEdit();

  const section = useMemo((): WorkspaceSectionRecord | null => {
    if (!edit) {
      return null;
    }
    return edit.sections.find((s) => s.id === sectionId) ?? null;
  }, [edit?.sections, sectionId]);

  if (!edit || !section) {
    return (
      <p className="text-sm text-muted-foreground">Loading section settings…</p>
    );
  }

  return (
    <div className="space-y-4">
      <SectionSettingsPanel
        section={section}
        onPatch={(patch) => edit.debouncedUpdateSection(sectionId, patch)}
      />
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={onDelete}>
        Delete section
      </Button>
    </div>
  );
}
