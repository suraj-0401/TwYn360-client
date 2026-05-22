"use client";

import { useCallback, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  parseSectionLayout,
  patchSectionTooltip,
  readSectionTooltipEnabled,
  SECTION_TYPE_OPTIONS,
  type SectionLayoutConfig,
  type SectionSettingsPatch,
} from "@/renderer/section-metadata.registry";
import type { WorkspaceSectionRecord } from "@/types/workspace";

const selectClass =
  "flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-700";

type SectionSettingsPanelProps = {
  section: WorkspaceSectionRecord;
  onPatch: (patch: SectionSettingsPatch) => void;
};

export function SectionSettingsPanel({
  section,
  onPatch,
}: SectionSettingsPanelProps) {
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description ?? "");
  const [tooltipEnabled, setTooltipEnabled] = useState(() =>
    readSectionTooltipEnabled(section.layoutConfig),
  );
  const [tooltipText, setTooltipText] = useState(section.tooltip ?? "");
  const [layout, setLayout] = useState(() =>
    parseSectionLayout(section.layoutConfig),
  );

  const layoutSyncKey = JSON.stringify({
    columns: section.layoutConfig?.columns,
    density: (section.layoutConfig as { density?: string })?.density,
    fieldGap: (section.layoutConfig as { fieldGap?: number })?.fieldGap,
    collapsible: section.layoutConfig?.collapsible,
    defaultExpanded: section.layoutConfig?.defaultExpanded,
    sectionType: section.layoutConfig?.sectionType,
    tooltipEnabled: (section.layoutConfig as { tooltipEnabled?: boolean })
      ?.tooltipEnabled,
  });

  useEffect(() => {
    setTitle(section.title);
    setDescription(section.description ?? "");
    setTooltipEnabled(readSectionTooltipEnabled(section.layoutConfig));
    setTooltipText(section.tooltip ?? "");
    setLayout(parseSectionLayout(section.layoutConfig));
  }, [
    section.id,
    section.title,
    section.description,
    section.tooltip,
    layoutSyncKey,
  ]);

  const emitTooltip = useCallback(
    (enabled: boolean, message: string) => {
      onPatch(patchSectionTooltip(enabled, message));
    },
    [onPatch],
  );

  const patchLayout = useCallback(
    (next: Partial<SectionLayoutConfig>) => {
      setLayout((prev) => {
        const merged = { ...prev, ...next };
        onPatch({ layoutConfig: next });
        return merged;
      });
    },
    [onPatch],
  );

  return (
    <div className="space-y-6 text-sm">
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">General</p>
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => {
              const next = e.target.value;
              setTitle(next);
              onPatch({ title: next });
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => {
              const next = e.target.value;
              setDescription(next);
              onPatch({ description: next });
            }}
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
            checked={tooltipEnabled}
            onChange={(e) => {
              const next = e.target.checked;
              setTooltipEnabled(next);
              emitTooltip(next, tooltipText);
            }}
          />
          <span>Tooltip</span>
        </label>
        {tooltipEnabled ? (
          <div className="space-y-1.5">
            <Label>Tooltip text</Label>
            <Input
              value={tooltipText}
              onChange={(e) => {
                const next = e.target.value;
                setTooltipText(next);
                onPatch(patchSectionTooltip(true, next));
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Layout</p>
        <div className="space-y-1.5">
          <Label>Columns</Label>
          <select
            className={selectClass}
            value={String(layout.columns)}
            onChange={(e) => {
              const columns = Number(e.target.value) as 1 | 2;
              patchLayout({ columns });
            }}
          >
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
            checked={layout.collapsible}
            onChange={(e) => patchLayout({ collapsible: e.target.checked })}
          />
          Collapsible
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
            checked={layout.defaultExpanded}
            disabled={!layout.collapsible}
            onChange={(e) => patchLayout({ defaultExpanded: e.target.checked })}
          />
          Expanded by default
        </label>
        <div className="space-y-1.5">
          <Label>Vertical spacing</Label>
          <select
            className={selectClass}
            value={layout.density}
            onChange={(e) =>
              patchLayout({
                density: e.target.value as typeof layout.density,
              })
            }
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Field gap</Label>
          <select
            className={selectClass}
            value={String(layout.fieldGap)}
            onChange={(e) =>
              patchLayout({
                fieldGap: Number(e.target.value) as typeof layout.fieldGap,
              })
            }
          >
            <option value="12">12px</option>
            <option value="16">16px</option>
            <option value="24">24px</option>
            <option value="32">32px</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Section type</Label>
        <select
          className={selectClass}
          value={layout.sectionType}
          onChange={(e) =>
            patchLayout({
              sectionType: e.target.value as typeof layout.sectionType,
            })
          }
        >
          {SECTION_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={!opt.enabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
