"use client";

import { useEffect, useRef, useState } from "react";
import { TooltipInfoTrigger } from "@/components/ui/tooltip";
import {
  formSectionDescriptionInputClass,
  formSectionTitleInputClass,
} from "@/renderer/form-styles";
import { readSectionTooltipEnabled } from "@/renderer/section-metadata.registry";
import { useWorkspaceEdit } from "../context/workspace-edit-context";
import { SectionHeaderMenu } from "./section-header-menu";

type EditableSectionHeaderProps = {
  sectionKey: string;
  sectionId: string;
  sectionIndex: number;
  sectionCount: number;
  title: string;
  description?: string;
  tooltip?: string;
};

export function EditableSectionHeader({
  sectionKey,
  sectionId,
  sectionIndex,
  sectionCount,
  title,
  description,
  tooltip,
}: EditableSectionHeaderProps) {
  const edit = useWorkspaceEdit();
  const record = edit?.sectionRecordByKey(sectionKey);
  const tooltipEnabled = record
    ? readSectionTooltipEnabled(record.layoutConfig)
    : Boolean(tooltip?.trim());

  const displayTitle = record?.title ?? title;
  const displayDescription = record?.description ?? description ?? "";
  const displayTooltip = record?.tooltip ?? tooltip;

  const [titleValue, setTitleValue] = useState(displayTitle);
  const [descriptionValue, setDescriptionValue] = useState(displayDescription);
  const titleFocused = useRef(false);
  const descriptionFocused = useRef(false);

  useEffect(() => {
    if (!titleFocused.current) {
      setTitleValue(displayTitle);
    }
  }, [sectionKey, displayTitle]);

  useEffect(() => {
    if (!descriptionFocused.current) {
      setDescriptionValue(displayDescription);
    }
  }, [sectionKey, displayDescription]);

  if (!edit || !record) {
    return null;
  }

  const hint =
    tooltipEnabled && displayTooltip?.trim() ? displayTooltip.trim() : null;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <input
            className={formSectionTitleInputClass}
            value={titleValue}
            placeholder="Untitled section"
            aria-label="Section title"
            onChange={(e) => {
              setTitleValue(e.target.value);
              edit.debouncedUpdateSection(record.id, { title: e.target.value });
            }}
            onFocus={() => {
              titleFocused.current = true;
            }}
            onBlur={() => {
              titleFocused.current = false;
              edit.debouncedUpdateSection(record.id, {
                title: titleValue.trim() || "Untitled section",
              });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
          />
          {hint ? (
            <TooltipInfoTrigger
              label={hint}
              side="top"
              iconClassName="h-4 w-4"
              ariaLabel={`Section help: ${hint}`}
            />
          ) : null}
        </div>
        <input
          className={formSectionDescriptionInputClass}
          value={descriptionValue}
          placeholder="Description (optional)"
          aria-label="Section description"
          onChange={(e) => {
            setDescriptionValue(e.target.value);
            edit.debouncedUpdateSection(record.id, {
              description: e.target.value,
            });
          }}
          onFocus={() => {
            descriptionFocused.current = true;
          }}
          onBlur={() => {
            descriptionFocused.current = false;
            const trimmed = descriptionValue.trim();
            edit.debouncedUpdateSection(record.id, {
              description: trimmed || null,
            });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
        />
      </div>
      <SectionHeaderMenu
        sectionId={sectionId}
        sectionIndex={sectionIndex}
        sectionCount={sectionCount}
      />
    </div>
  );
}
