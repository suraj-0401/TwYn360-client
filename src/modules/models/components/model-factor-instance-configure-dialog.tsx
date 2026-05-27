"use client";

import { useEffect, useState } from "react";
import { useConfirm } from "@/components/feedback";
import {
  MUTATION_ACTION_LABEL,
  MUTATION_HELP_COPY,
  MUTATION_SUCCESS_MESSAGE,
  mutationConfirm,
} from "@/config/mutation-labels";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LookupSelect } from "@/modules/lookups/components/lookup-select";
import { platform } from "@/styles/tokens";
import { cn } from "@/lib/utils";
import type {
  ModelFactorInstanceOverrides,
  ResolvedModelFactorInstance,
  UpdateModelFactorInstancePayload,
} from "@/types/model-factor-instance";
import { isFactorSetUnavailable } from "../utils/factor-set-lifecycle";

type OverrideFormState = {
  overrideDisplayName: string;
  overrideUnitCode: string;
  overrideRequired: boolean | null;
  overrideDefaultValue: string;
  useDisplayNameOverride: boolean;
  useUnitOverride: boolean;
  useRequiredOverride: boolean;
  useDefaultOverride: boolean;
};

function formatRegistryValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function instanceHasOverrides(instance: ResolvedModelFactorInstance): boolean {
  const o = instance.overrides;
  return (
    o.displayName !== null ||
    o.unitCode !== null ||
    o.required !== null ||
    o.defaultValue !== null
  );
}

function initFormState(
  instance: ResolvedModelFactorInstance,
): OverrideFormState {
  return {
    overrideDisplayName: instance.overrides.displayName ?? "",
    overrideUnitCode: instance.overrides.unitCode ?? "",
    overrideRequired: instance.overrides.required,
    overrideDefaultValue:
      instance.overrides.defaultValue !== null &&
      instance.overrides.defaultValue !== undefined
        ? String(instance.overrides.defaultValue)
        : "",
    useDisplayNameOverride: instance.overrides.displayName !== null,
    useUnitOverride: instance.overrides.unitCode !== null,
    useRequiredOverride: instance.overrides.required !== null,
    useDefaultOverride: instance.overrides.defaultValue !== null,
  };
}

function buildPatchPayload(
  instance: ResolvedModelFactorInstance,
  form: OverrideFormState,
): UpdateModelFactorInstancePayload {
  const payload: UpdateModelFactorInstancePayload = {
    expectedVersion: instance.version,
  };

  const nextDisplayName = form.useDisplayNameOverride
    ? form.overrideDisplayName.trim() || null
    : null;
  if (nextDisplayName !== instance.overrides.displayName) {
    payload.overrideDisplayName = nextDisplayName;
  }

  const nextUnit = form.useUnitOverride ? form.overrideUnitCode.trim() || null : null;
  if (nextUnit !== instance.overrides.unitCode) {
    payload.overrideUnitCode = nextUnit;
  }

  const nextRequired = form.useRequiredOverride ? form.overrideRequired : null;
  if (nextRequired !== instance.overrides.required) {
    payload.overrideRequired = nextRequired;
  }

  let nextDefault: unknown | null = null;
  if (form.useDefaultOverride) {
    const raw = form.overrideDefaultValue.trim();
    if (raw === "") {
      nextDefault = null;
    } else if (instance.resolved.dataTypeCode === "number") {
      nextDefault = Number(raw);
    } else if (instance.resolved.dataTypeCode === "boolean") {
      nextDefault = raw === "true";
    } else {
      nextDefault = raw;
    }
  }
  if (nextDefault !== instance.overrides.defaultValue) {
    payload.overrideDefaultValue = nextDefault;
  }

  return payload;
}

function RegistryHint({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <p className="text-xs text-[#52525b]">
      Registry {label}:{" "}
      <span className="text-[#71717a]">{formatRegistryValue(value)}</span>
    </p>
  );
}

type ModelFactorInstanceConfigureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: ResolvedModelFactorInstance | null;
  readOnly?: boolean;
  onSave: (
    instanceId: string,
    payload: UpdateModelFactorInstancePayload,
  ) => Promise<void>;
};

export function ModelFactorInstanceConfigureDialog({
  open,
  onOpenChange,
  instance,
  readOnly = false,
  onSave,
}: ModelFactorInstanceConfigureDialogProps) {
  const { confirm } = useConfirm();
  const [form, setForm] = useState<OverrideFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (instance && open) {
      setForm(initFormState(instance));
    }
  }, [instance, open]);

  if (!instance || !form) {
    return null;
  }

  const resolved = instance.resolved;

  async function handleSave() {
    if (!instance || !form || readOnly) {
      return;
    }

    const payload = buildPatchPayload(instance, form);
    const hasChange = Object.keys(payload).some((key) => key !== "expectedVersion");
    if (!hasChange) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(instance.id, payload);
      toast.success(MUTATION_SUCCESS_MESSAGE.configurationSaved);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleClearAllOverrides() {
    if (!instance || readOnly || !instanceHasOverrides(instance)) {
      return;
    }

    const ok = await confirm(
      mutationConfirm.clearAllInstanceOverrides(instance.factor.displayName),
    );
    if (!ok) {
      return;
    }

    setClearing(true);
    try {
      await onSave(instance.id, {
        expectedVersion: instance.version,
        overrideDisplayName: null,
        overrideUnitCode: null,
        overrideRequired: null,
        overrideDefaultValue: null,
      });
      toast.success(MUTATION_SUCCESS_MESSAGE.overridesCleared);
      onOpenChange(false);
    } finally {
      setClearing(false);
    }
  }

  function resetField(field: keyof ModelFactorInstanceOverrides) {
    if (!instance) {
      return;
    }

    setForm((current) => {
      if (!current) {
        return current;
      }

      if (field === "displayName") {
        return {
          ...current,
          useDisplayNameOverride: false,
          overrideDisplayName: "",
        };
      }
      if (field === "unitCode") {
        return { ...current, useUnitOverride: false, overrideUnitCode: "" };
      }
      if (field === "required") {
        return { ...current, useRequiredOverride: false, overrideRequired: null };
      }
      if (field === "defaultValue") {
        return {
          ...current,
          useDefaultOverride: false,
          overrideDefaultValue: "",
        };
      }
      return current;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "fixed top-0 right-0 left-auto flex h-full max-h-none w-full max-w-lg translate-x-0 translate-y-0 flex-col rounded-none border-l border-white/[0.08] bg-[#0c0c0e] p-0 sm:max-w-lg",
          "data-open:slide-in-from-right data-closed:slide-out-to-right",
        )}
      >
        <DialogHeader className="border-b border-white/[0.06] px-5 py-4">
          <DialogTitle className="text-[#f4f4f5]">
            Configure factor
          </DialogTitle>
          <DialogDescription className="text-[#71717a]">
            {instance.factor.displayName}{" "}
            <span className="text-[#52525b]">({instance.factor.slug})</span>
            {instance.sourceFactorSet ? (
              <>
                {" "}
                · from {instance.sourceFactorSet.displayName}
              </>
            ) : null}
            <span className="mt-2 block text-xs leading-relaxed">
              {MUTATION_HELP_COPY.instanceOverridesHint}
            </span>
          </DialogDescription>
          {instance.sourceFactorSet &&
          isFactorSetUnavailable(instance.sourceFactorSet.statusCode) ? (
            <p className="mt-2 rounded-md border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs leading-relaxed text-sky-200/90">
              The global factor set is{" "}
              {instance.sourceFactorSet.statusCode === "archived"
                ? "archived"
                : "unavailable"}
              . This model keeps this factor instance so formulas and audit
              references remain stable.
            </p>
          ) : null}
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className={platform.label}>Display name</Label>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-[#71717a]"
                  onClick={() => resetField("displayName")}
                >
                  {MUTATION_ACTION_LABEL.clearOverride}
                </Button>
              ) : null}
            </div>
            <RegistryHint label="display name" value={resolved.displayName} />
            <label className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <input
                type="checkbox"
                checked={form.useDisplayNameOverride}
                disabled={readOnly}
                onChange={(e) =>
                  setForm((s) =>
                    s ? { ...s, useDisplayNameOverride: e.target.checked } : s,
                  )
                }
              />
              Override display name
            </label>
            {form.useDisplayNameOverride ? (
              <Input
                value={form.overrideDisplayName}
                disabled={readOnly}
                onChange={(e) =>
                  setForm((s) =>
                    s ? { ...s, overrideDisplayName: e.target.value } : s,
                  )
                }
                className="border-white/10 bg-white/[0.02]"
              />
            ) : null}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className={platform.label}>Unit</Label>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-[#71717a]"
                  onClick={() => resetField("unitCode")}
                >
                  {MUTATION_ACTION_LABEL.clearOverride}
                </Button>
              ) : null}
            </div>
            <RegistryHint label="unit" value={resolved.unitCode} />
            <label className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <input
                type="checkbox"
                checked={form.useUnitOverride}
                disabled={readOnly}
                onChange={(e) =>
                  setForm((s) =>
                    s ? { ...s, useUnitOverride: e.target.checked } : s,
                  )
                }
              />
              Override unit
            </label>
            {form.useUnitOverride ? (
              <LookupSelect
                typeCode="FACTOR_UNIT"
                label=""
                value={form.overrideUnitCode}
                onChange={(value) =>
                  setForm((s) => (s ? { ...s, overrideUnitCode: value } : s))
                }
              />
            ) : null}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className={platform.label}>Required</Label>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-[#71717a]"
                  onClick={() => resetField("required")}
                >
                  {MUTATION_ACTION_LABEL.clearOverride}
                </Button>
              ) : null}
            </div>
            <RegistryHint label="required" value={resolved.required} />
            <label className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <input
                type="checkbox"
                checked={form.useRequiredOverride}
                disabled={readOnly}
                onChange={(e) =>
                  setForm((s) =>
                    s ? { ...s, useRequiredOverride: e.target.checked } : s,
                  )
                }
              />
              Override required
            </label>
            {form.useRequiredOverride ? (
              <label className="flex items-center gap-2 text-sm text-[#d4d4d8]">
                <input
                  type="checkbox"
                  checked={form.overrideRequired === true}
                  disabled={readOnly}
                  onChange={(e) =>
                    setForm((s) =>
                      s ? { ...s, overrideRequired: e.target.checked } : s,
                    )
                  }
                />
                Required on this model
              </label>
            ) : null}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className={platform.label}>Default value</Label>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-[#71717a]"
                  onClick={() => resetField("defaultValue")}
                >
                  {MUTATION_ACTION_LABEL.clearOverride}
                </Button>
              ) : null}
            </div>
            <RegistryHint label="default" value={resolved.defaultValue} />
            <label className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <input
                type="checkbox"
                checked={form.useDefaultOverride}
                disabled={readOnly}
                onChange={(e) =>
                  setForm((s) =>
                    s ? { ...s, useDefaultOverride: e.target.checked } : s,
                  )
                }
              />
              Override default value
            </label>
            {form.useDefaultOverride ? (
              <Input
                value={form.overrideDefaultValue}
                disabled={readOnly}
                placeholder={
                  resolved.dataTypeCode === "boolean"
                    ? "true or false"
                    : undefined
                }
                onChange={(e) =>
                  setForm((s) =>
                    s ? { ...s, overrideDefaultValue: e.target.value } : s,
                  )
                }
                className="border-white/10 bg-white/[0.02]"
              />
            ) : null}
          </section>
        </div>

        <DialogFooter className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {!readOnly && instanceHasOverrides(instance) ? (
            <Button
              type="button"
              variant="ghost"
              className="text-[#a1a1aa] hover:text-[#f4f4f5]"
              disabled={saving || clearing}
              onClick={() => void handleClearAllOverrides()}
            >
              {clearing
                ? "Clearing…"
                : MUTATION_ACTION_LABEL.clearAllOverrides}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10"
              onClick={() => onOpenChange(false)}
            >
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {!readOnly ? (
              <LoadingButton
                loading={saving}
                disabled={clearing}
                onClick={() => void handleSave()}
              >
                {MUTATION_ACTION_LABEL.saveConfiguration}
              </LoadingButton>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
