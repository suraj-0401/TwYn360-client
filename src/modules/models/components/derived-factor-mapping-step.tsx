"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  DerivedFactorDefinitionDto,
  DerivedFactorMappingConfigDto,
} from "@/types/formula";
import type { ResolvedModelFactorInstance } from "@/types/model-factor-instance";
import {
  getEnumOptionsFromInstance,
  isFactorDefinedEnumKey,
  normalizeEnumKey,
  syncMappingRowsFromEnumOptions,
} from "@/modules/models/utils/enum-options-from-instance";
import { slugToFormulaAlias } from "@/modules/models/utils/formula-variable-pool";

type MappingStepProps = {
  derivedFactor: DerivedFactorDefinitionDto;
  factorInstances: ResolvedModelFactorInstance[];
  readOnly?: boolean;
  transformationOnly?: boolean;
  onSave: (payload: {
    derivedFactorType: "formula" | "categorical_mapping";
    mappingConfig: DerivedFactorMappingConfigDto | null;
    mappingVersion?: number;
  }) => Promise<void>;
};

type MappingRow = { key: string; value: string };

function rowsFromConfig(
  config: DerivedFactorMappingConfigDto | null,
): MappingRow[] {
  return (config?.mappings ?? []).map((row) => ({
    key: row.key,
    value: String(row.value),
  }));
}

function parseNumeric(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function DerivedFactorMappingStep({
  derivedFactor,
  factorInstances,
  readOnly = false,
  transformationOnly = false,
  onSave,
}: MappingStepProps) {
  const enumInstances = useMemo(
    () => factorInstances.filter((row) => row.resolved.dataTypeCode === "enum"),
    [factorInstances],
  );

  const [derivedFactorType, setDerivedFactorType] = useState<
    "formula" | "categorical_mapping"
  >(
    transformationOnly
      ? "categorical_mapping"
      : derivedFactor.derivedFactorType,
  );
  const [sourceFactorInstanceId, setSourceFactorInstanceId] = useState(
    derivedFactor.mappingConfig?.sourceFactorInstanceId ?? enumInstances[0]?.id ?? "",
  );
  const [mappings, setMappings] = useState<MappingRow[]>(
    rowsFromConfig(derivedFactor.mappingConfig),
  );
  const [fallbackValue, setFallbackValue] = useState(
    derivedFactor.mappingConfig ? String(derivedFactor.mappingConfig.fallbackValue) : "0",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceInstance = enumInstances.find((row) => row.id === sourceFactorInstanceId);
  const sourceEnumOptions = useMemo(
    () => (sourceInstance ? getEnumOptionsFromInstance(sourceInstance) : []),
    [sourceInstance],
  );
  const outputAlias = slugToFormulaAlias(derivedFactor.slug);

  useEffect(() => {
    setDerivedFactorType(
      transformationOnly ? "categorical_mapping" : derivedFactor.derivedFactorType,
    );
    const nextSourceId =
      derivedFactor.mappingConfig?.sourceFactorInstanceId ??
      enumInstances[0]?.id ??
      "";
    setSourceFactorInstanceId(nextSourceId);
    const instance = enumInstances.find((row) => row.id === nextSourceId);
    const options = instance ? getEnumOptionsFromInstance(instance) : [];
    setMappings(
      syncMappingRowsFromEnumOptions(
        rowsFromConfig(derivedFactor.mappingConfig),
        options,
      ),
    );
    setFallbackValue(
      derivedFactor.mappingConfig
        ? String(derivedFactor.mappingConfig.fallbackValue)
        : "0",
    );
    setError(null);
  }, [derivedFactor, enumInstances, transformationOnly]);

  function handleSourceChange(nextSourceId: string) {
    setSourceFactorInstanceId(nextSourceId);
    const instance = enumInstances.find((row) => row.id === nextSourceId);
    if (!instance) {
      setMappings([]);
      return;
    }
    const options = getEnumOptionsFromInstance(instance);
    setMappings((prev) => syncMappingRowsFromEnumOptions(prev, options));
  }

  function updateMapping(index: number, key: keyof MappingRow, value: string) {
    setMappings((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  }

  function addCustomMapping() {
    setMappings((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeMapping(index: number) {
    setMappings((prev) => {
      const row = prev[index];
      if (row && isFactorDefinedEnumKey(row.key, sourceEnumOptions)) {
        return prev;
      }
      return prev.filter((_, rowIndex) => rowIndex !== index);
    });
  }

  async function handleSave() {
    if (readOnly) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (derivedFactorType === "formula") {
        await onSave({
          derivedFactorType,
          mappingConfig: null,
        });
        return;
      }

      if (!sourceFactorInstanceId) {
        throw new Error("Select an enum source factor.");
      }

      const fallback = parseNumeric(fallbackValue);
      if (fallback === null) {
        throw new Error("Fallback value must be numeric.");
      }

      const rowsForSave = syncMappingRowsFromEnumOptions(
        mappings,
        sourceEnumOptions,
      );
      const parsedMappings = rowsForSave
        .map((row) => ({
          key: row.key.trim(),
          value: parseNumeric(row.value),
        }))
        .filter((row) => row.key.length > 0);

      if (parsedMappings.length === 0) {
        throw new Error("Add at least one mapping row.");
      }
      if (parsedMappings.some((row) => row.value === null)) {
        throw new Error("All mapping values must be numeric.");
      }

      if (sourceEnumOptions.length > 0) {
        const mappedFactorKeys = new Set<string>();
        for (const row of parsedMappings) {
          if (isFactorDefinedEnumKey(row.key, sourceEnumOptions)) {
            mappedFactorKeys.add(normalizeEnumKey(row.key));
          }
        }
        const missing = sourceEnumOptions.filter(
          (opt) => !mappedFactorKeys.has(normalizeEnumKey(opt.value)),
        );
        if (missing.length > 0) {
          throw new Error(
            `Missing mappings for: ${missing.map((opt) => opt.value).join(", ")}`,
          );
        }
      }

      const keySet = new Set<string>();
      for (const row of parsedMappings) {
        const key = normalizeEnumKey(row.key);
        if (keySet.has(key)) {
          throw new Error(`Duplicate mapping key "${row.key}"`);
        }
        keySet.add(key);
      }

      const mappingConfig: DerivedFactorMappingConfigDto = {
        sourceFactorInstanceId,
        mappings: parsedMappings.map((row) => ({
          key: row.key,
          value: row.value!,
        })),
        fallbackValue: fallback,
      };

      const changed =
        JSON.stringify(mappingConfig) !==
          JSON.stringify(derivedFactor.mappingConfig) ||
        derivedFactorType !== derivedFactor.derivedFactorType;

      await onSave({
        derivedFactorType,
        mappingConfig,
        ...(changed
          ? { mappingVersion: Math.max(1, derivedFactor.mappingVersion + 1) }
          : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transformation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-4xl flex-col gap-4 overflow-y-auto pb-2">
      <div>
        <h3 className="text-sm font-semibold text-[#f4f4f5]">Transformations</h3>
        <p className="mt-1 text-xs text-[#71717a]">
          {transformationOnly
            ? "Map enum options from the source factor to numeric codes. Add extra rows for additional values not on the factor."
            : "Map enum options to numbers, or switch to formula for math-based derived factors."}
        </p>
      </div>

      {transformationOnly || derivedFactorType === "categorical_mapping" ? (
        <section className="overflow-hidden rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wide text-[#52525b]">
                <th className="px-3 py-2">Source factor (raw)</th>
                <th className="px-3 py-2">Transformation</th>
                <th className="px-3 py-2">Output factor (numeric)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2.5 font-mono text-[#e4e4e7]">
                  {sourceInstance
                    ? slugToFormulaAlias(sourceInstance.factor.slug)
                    : "—"}
                </td>
                <td className="px-3 py-2.5 text-[#a1a1aa]">Categorical mapping</td>
                <td className="px-3 py-2.5 font-mono text-cyan-200/90">{outputAlias}</td>
              </tr>
            </tbody>
          </table>
        </section>
      ) : null}

      {!transformationOnly ? (
        <section className="rounded-xl border border-white/[0.08] bg-[#121214] p-4">
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-[#71717a]">
            Derived factor type
          </label>
          <select
            value={derivedFactorType}
            disabled={readOnly}
            onChange={(event) =>
              setDerivedFactorType(event.target.value as "formula" | "categorical_mapping")
            }
            className="w-full rounded border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-zinc-200"
          >
            <option value="formula">Formula (mathematical computation)</option>
            <option value="categorical_mapping">
              Transformation (enum → numeric only)
            </option>
          </select>
        </section>
      ) : null}

      {derivedFactorType === "categorical_mapping" ? (
        <>
          <section className="rounded-xl border border-white/[0.08] bg-[#121214] p-4">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-[#71717a]">
              Source enum factor
            </label>
            <select
              value={sourceFactorInstanceId}
              disabled={readOnly}
              onChange={(event) => handleSourceChange(event.target.value)}
              className="w-full rounded border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-zinc-200"
            >
              <option value="">Select enum factor</option>
              {enumInstances.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.resolved.displayName} ({row.factor.slug})
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-[#121214] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
                Numeric mappings
              </p>
              {!readOnly ? (
                <button
                  type="button"
                  onClick={addCustomMapping}
                  className="rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/[0.04]"
                >
                  Add mapping
                </button>
              ) : null}
            </div>

            {sourceEnumOptions.length === 0 && mappings.length === 0 ? (
              <p className="text-xs text-amber-200/90">
                No enum options on the source factor yet. Add Enum options on the raw factor,
                or use Add mapping for custom values.
              </p>
            ) : null}

            {mappings.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_8rem_auto] gap-2 px-1 text-[10px] uppercase tracking-wide text-[#52525b]">
                  <span>Enum value</span>
                  <span>Numeric code</span>
                  <span className="w-16" />
                </div>
                {mappings.map((row, index) => {
                  const fromFactor = isFactorDefinedEnumKey(row.key, sourceEnumOptions);
                  const option = sourceEnumOptions.find(
                    (opt) => normalizeEnumKey(opt.value) === normalizeEnumKey(row.key),
                  );
                  return (
                    <div key={`mapping-${index}-${row.key}`} className="flex gap-2">
                      {fromFactor ? (
                        <div
                          className="flex flex-1 items-center rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 text-xs text-zinc-300"
                          title={
                            option && option.label !== option.value
                              ? option.label
                              : undefined
                          }
                        >
                          <span className="font-mono">{row.key}</span>
                          {option && option.label !== option.value ? (
                            <span className="ml-2 truncate text-[#71717a]">
                              {option.label}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={row.key}
                          disabled={readOnly}
                          onChange={(event) =>
                            updateMapping(index, "key", event.target.value)
                          }
                          placeholder="Custom enum value"
                          className="flex-1 rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-zinc-200"
                        />
                      )}
                      <input
                        type="number"
                        value={row.value}
                        disabled={readOnly}
                        onChange={(event) =>
                          updateMapping(index, "value", event.target.value)
                        }
                        className="w-36 rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-zinc-200"
                      />
                      {!readOnly && !fromFactor ? (
                        <button
                          type="button"
                          onClick={() => removeMapping(index)}
                          className="w-16 rounded border border-rose-500/30 px-2 py-1 text-[10px] text-rose-200"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="w-16" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-3">
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-[#71717a]">
                Fallback
              </label>
              <input
                type="number"
                value={fallbackValue}
                disabled={readOnly}
                onChange={(event) => setFallbackValue(event.target.value)}
                className="w-48 rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-zinc-200"
              />
              <p className="mt-1 text-[10px] text-[#52525b]">
                Used when the input does not match any row above.
              </p>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-xl border border-white/[0.08] bg-[#121214] p-4 text-xs text-[#71717a]">
          Formula-type derived factors use Parameters and Formula Studio — not this step.
        </section>
      )}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {!readOnly ? (
        <div>
          <button
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={saving}
            className="rounded border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200"
          >
            {saving ? "Saving…" : "Save transformation"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
