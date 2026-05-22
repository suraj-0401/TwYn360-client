"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FIELD_TYPE_CATALOG,
  normalizeFieldType,
  type FieldOption,
} from "@/renderer/field-metadata.registry";
import {
  getSettingsSchemaForFieldType,
  optionsToText,
  patchFromControl,
  patchFromTooltipControl,
  readSettingValue,
  readTooltipEnabled,
  textToOptions,
  type FieldSettingsPatch,
  type SettingControl,
} from "@/renderer/field-settings.registry";
import type { RendererFieldType } from "@/renderer/types";
import type { WorkspaceFieldRecord } from "@/types/workspace";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLookupCollection } from "@/services/lookup-collection.service";
import {
  lookupCollectionsQueryKey,
  useLookupCollections,
} from "@/modules/lookups/hooks/use-lookup-collections";
import { useWorkspaceEdit } from "@/renderer/context/workspace-edit-context";

const selectClass =
  "flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-700";

type FieldSettingsRendererProps = {
  field: WorkspaceFieldRecord;
  onPatch: (patch: FieldSettingsPatch) => void;
  onFieldTypeChange: (nextType: RendererFieldType) => Promise<void>;
  onOptionsSave: (options: FieldOption[]) => Promise<void>;
};

export function FieldSettingsRenderer({
  field,
  onPatch,
  onFieldTypeChange,
  onOptionsSave,
}: FieldSettingsRendererProps) {
  const fieldType = normalizeFieldType(field.fieldType ?? "text");
  const sections = useMemo(
    () => getSettingsSchemaForFieldType(fieldType),
    [fieldType],
  );

  const configOptions = (field.config as { options?: FieldOption[] } | null)
    ?.options;
  const [optionsText, setOptionsText] = useState(() =>
    optionsToText(configOptions),
  );

  useEffect(() => {
    setOptionsText(optionsToText(configOptions));
  }, [field.id]);

  const applyControl = useCallback(
    (control: SettingControl, raw: string | number | boolean) => {
      const patch = patchFromControl(control, raw, field);
      if (Object.keys(patch).length > 0) {
        onPatch(patch);
      }
    },
    [onPatch, field],
  );

  return (
    <div className="space-y-6 text-sm">
      <div className="space-y-1.5">
        <Label htmlFor="field-type-select">Type</Label>
        <select
          id="field-type-select"
          className={selectClass}
          value={fieldType}
          onChange={(e) =>
            void onFieldTypeChange(e.target.value as RendererFieldType)
          }
        >
          {FIELD_TYPE_CATALOG.map((t) => (
            <option key={t.fieldType} value={t.fieldType}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {sections.map((group) => (
        <div key={group.section} className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            {group.title}
          </p>
          <div className="space-y-3">
            {group.controls.map((control) => {
              if (control.kind === "options") {
                return (
                  <div key={control.id} className="space-y-1.5">
                    <Label>Options</Label>
                    <Textarea
                      className="min-h-[88px] font-mono text-xs"
                      rows={4}
                      value={optionsText}
                      placeholder="One per line"
                      onChange={(e) => setOptionsText(e.target.value)}
                      onBlur={() =>
                        void onOptionsSave(textToOptions(optionsText))
                      }
                    />
                  </div>
                );
              }

              if (control.kind === "lookup-collection") {
                return (
                  <LookupCollectionControl
                    key={control.id}
                    control={control}
                    field={field}
                    onChange={(value) => applyControl(control, value)}
                  />
                );
              }

              if (control.kind === "tooltip") {
                return (
                  <TooltipSettingControl
                    key={control.id}
                    field={field}
                    onPatch={onPatch}
                  />
                );
              }

              return (
                <SettingControlInput
                  key={control.id}
                  control={control}
                  field={field}
                  onChange={(value) => applyControl(control, value)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function TooltipSettingControl({
  field,
  onPatch,
}: {
  field: WorkspaceFieldRecord;
  onPatch: (patch: FieldSettingsPatch) => void;
}) {
  const [enabled, setEnabled] = useState(() => readTooltipEnabled(field));
  const [message, setMessage] = useState(() => field.tooltip ?? "");

  useEffect(() => {
    setEnabled(readTooltipEnabled(field));
    setMessage(field.tooltip ?? "");
  }, [field.id]);

  const debouncedTooltipPatch = useDebouncedCallback(
    (patch: FieldSettingsPatch) => {
      onPatch(patch);
    },
    250,
  );

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300"
          checked={enabled}
          onChange={(e) => {
            const next = e.target.checked;
            setEnabled(next);
            onPatch(patchFromTooltipControl(next, message));
          }}
        />
        <span>Tooltip</span>
      </label>
      {enabled ? (
        <div className="space-y-1.5">
          <Input
            value={message}
            placeholder="Help text"
            onChange={(e) => {
              const next = e.target.value;
              setMessage(next);
              debouncedTooltipPatch(patchFromTooltipControl(true, next));
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function LookupCollectionControl({
  control,
  field,
  onChange,
}: {
  control: SettingControl;
  field: WorkspaceFieldRecord;
  onChange: (value: string) => void;
}) {
  const edit = useWorkspaceEdit();
  const adminKey = edit?.adminKey;
  const queryClient = useQueryClient();
  const { data: collections, isLoading } = useLookupCollections();
  const raw = readSettingValue(field, control);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      createLookupCollection({ label: newLabel.trim() }, adminKey),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({
        queryKey: lookupCollectionsQueryKey(),
      });
      onChange(res.data.id);
      setNewLabel("");
      setCreating(false);
      setCreateError(null);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  return (
    <div className="space-y-1.5">
      <Label>{control.label}</Label>
      <select
        className={selectClass}
        value={String(raw || "")}
        disabled={isLoading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choose collection…</option>
        {collections
          ?.filter((c) => !c.isSystem)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
      </select>
      {creating ? (
        <div className="space-y-2 pt-1">
          <Input
            placeholder="Collection name"
            value={newLabel}
            onChange={(e) => {
              setNewLabel(e.target.value);
              setCreateError(null);
            }}
          />
          {createError ? (
            <p className="text-xs text-red-600">{createError}</p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCreating(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!adminKey || !newLabel.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => setCreating(true)}
        >
          New collection
        </button>
      )}
    </div>
  );
}

function SettingControlInput({
  control,
  field,
  onChange,
}: {
  control: SettingControl;
  field: WorkspaceFieldRecord;
  onChange: (value: string | number | boolean) => void;
}) {
  const raw = readSettingValue(field, control);
  const serialized =
    raw === undefined || raw === null ? "" : String(raw);

  const [local, setLocal] = useState(serialized);

  useEffect(() => {
    const next = readSettingValue(field, control);
    setLocal(next === undefined || next === null ? "" : String(next));
  }, [field.id, control.id]);

  if (control.kind === "boolean") {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300"
          checked={Boolean(raw)}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{control.label}</span>
      </label>
    );
  }

  if (control.kind === "select") {
    return (
      <div className="space-y-1.5">
        <Label>{control.label}</Label>
        <select
          className={selectClass}
          value={String(raw || control.options?.[0]?.value || "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {control.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const inputType = control.kind === "number" ? "number" : "text";

  return (
    <div className="space-y-1.5">
      <Label>{control.label}</Label>
      <Input
        type={inputType}
        value={local}
        min={control.min}
        max={control.max}
        step={control.step}
        onChange={(e) => {
          const next =
            control.kind === "number"
              ? e.target.value === ""
                ? ""
                : Number(e.target.value)
              : e.target.value;
          setLocal(e.target.value);
          onChange(next);
        }}
      />
    </div>
  );
}
