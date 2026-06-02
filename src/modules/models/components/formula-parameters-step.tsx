"use client";

import { useMemo, useState } from "react";
import type { FormulaParameterInput } from "@/types/formula";
import {
  poolItemKey,
  type FormulaVariablePoolItem,
} from "@/modules/models/utils/formula-variable-pool";
import {
  buildUnitByAlias,
  formatUnitLabel,
  resolveParameterUnit,
} from "@/modules/models/utils/formula-unit-display";

type FormulaParametersStepProps = {
  variablePool: FormulaVariablePoolItem[];
  parameters: FormulaParameterInput[];
  onChange: (parameters: FormulaParameterInput[]) => void;
  readOnly?: boolean;
};

export function FormulaParametersStep({
  variablePool,
  parameters,
  onChange,
  readOnly = false,
}: FormulaParametersStepProps) {
  const [staticAliasDraft, setStaticAliasDraft] = useState("");
  const [staticValueDraft, setStaticValueDraft] = useState("");

  const dynamicPoolAvailable = useMemo(
    () => variablePool.filter((item) => !parameters.some((param) => param.alias === item.alias)),
    [parameters, variablePool],
  );

  const unitByAlias = useMemo(() => buildUnitByAlias(variablePool), [variablePool]);

  const factorInstances = dynamicPoolAvailable.filter((item) => item.sourceType === "FACTOR_INSTANCE");
  const derivedFactors = dynamicPoolAvailable.filter((item) => item.sourceType === "DERIVED_FACTOR");

  function addDynamic(item: FormulaVariablePoolItem) {
    if (parameters.some((param) => param.alias === item.alias)) {
      return;
    }
    const binding =
      item.sourceType === "DERIVED_FACTOR"
        ? { sourceType: "DERIVED_FACTOR" as const, derivedFactorId: item.derivedFactorId }
        : { sourceType: "FACTOR_INSTANCE" as const, instanceId: item.instanceId };
    onChange([
      ...parameters,
      {
        alias: item.alias,
        type: "DYNAMIC",
        ...binding,
        label: item.label,
        sortOrder: parameters.length,
      },
    ]);
  }

  function addStatic() {
    const alias = staticAliasDraft.trim();
    const value = Number(staticValueDraft);
    if (!alias || Number.isNaN(value) || parameters.some((p) => p.alias === alias)) {
      return;
    }
    onChange([
      ...parameters,
      { alias, type: "STATIC", defaultValue: value, sortOrder: parameters.length },
    ]);
    setStaticAliasDraft("");
    setStaticValueDraft("");
  }

  function remove(alias: string) {
    onChange(parameters.filter((param) => param.alias !== alias));
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-6 overflow-y-auto overscroll-y-contain pb-2 [-webkit-overflow-scrolling:touch]">
      <div className="shrink-0">
        <h3 className="text-sm font-semibold text-[#f4f4f5]">Step 2 — Parameters</h3>
        <p className="mt-1 text-xs text-[#71717a]">
          Declare dynamic inputs (factor instances, derived factors) and static constants before
          authoring the expression in Formula Studio.
        </p>
      </div>

      <section className="shrink-0 rounded-xl border border-white/[0.08] bg-[#121214] p-4">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
          Dynamic inputs
        </p>
        {variablePool.length === 0 ? (
          <p className="text-xs text-amber-200/90">
            Attach factor sets and/or create derived factors on this model first.
          </p>
        ) : dynamicPoolAvailable.length === 0 ? (
          <p className="text-xs text-[#71717a]">All model inputs are declared.</p>
        ) : (
          <div className="space-y-3">
            {factorInstances.length > 0 ? (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wide text-[#52525b]">
                  Factor instances
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {factorInstances.map((item) => (
                    <PoolCard
                      key={poolItemKey(item)}
                      alias={item.alias}
                      label={item.label}
                      unit={formatUnitLabel(item.unitCode)}
                      disabled={readOnly}
                      onAdd={() => addDynamic(item)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {derivedFactors.length > 0 ? (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wide text-[#52525b]">
                  Derived factors
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {derivedFactors.map((item) => (
                    <PoolCard
                      key={poolItemKey(item)}
                      alias={item.alias}
                      label={item.label}
                      unit={formatUnitLabel(item.unitCode)}
                      disabled={readOnly}
                      onAdd={() => addDynamic(item)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="shrink-0 rounded-xl border border-white/[0.08] bg-[#121214] p-4">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
          Static constants
        </p>
        {!readOnly ? (
          <div className="mb-3 flex flex-wrap gap-2">
            <input
              type="text"
              value={staticAliasDraft}
              onChange={(e) => setStaticAliasDraft(e.target.value)}
              placeholder="alias (e.g. k)"
              className="min-w-[120px] flex-1 rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-zinc-200"
            />
            <input
              type="number"
              value={staticValueDraft}
              onChange={(e) => setStaticValueDraft(e.target.value)}
              placeholder="value"
              className="w-24 rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-zinc-200"
            />
            <button
              type="button"
              onClick={addStatic}
              className="rounded border border-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/[0.06]"
            >
              Add constant
            </button>
          </div>
        ) : null}
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#121214] p-4">
        <p className="mb-3 shrink-0 text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
          Declared ({parameters.length})
        </p>
        {parameters.length === 0 ? (
          <p className="text-xs text-[#71717a]">No parameters yet.</p>
        ) : (
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch]">
            {parameters.map((param) => {
              const unit = resolveParameterUnit(param, unitByAlias);
              return (
              <li
                key={param.alias}
                className="flex items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-mono text-[#e4e4e7]">
                    {param.alias}
                    {unit ? (
                      <span className="ml-1.5 font-sans text-[10px] text-[#71717a]">({unit})</span>
                    ) : null}
                  </p>
                  <p className="text-[10px] text-[#71717a]">
                    {param.type === "STATIC"
                      ? `Static · ${param.defaultValue ?? "—"}${unit ? ` ${unit}` : ""}`
                      : param.sourceType === "DERIVED_FACTOR"
                        ? `Dynamic · derived factor${unit ? ` · ${unit}` : ""}`
                        : `Dynamic · factor instance${unit ? ` · ${unit}` : ""}`}
                  </p>
                </div>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => remove(param.alias)}
                    className="text-[10px] text-[#71717a] hover:text-rose-400"
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function PoolCard({
  alias,
  label,
  unit,
  disabled,
  onAdd,
}: {
  alias: string;
  label: string;
  unit: string | null;
  disabled: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAdd}
      className="flex items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-left hover:bg-white/[0.06] disabled:opacity-50"
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-xs text-[#e4e4e7]">
          {alias}
          {unit ? (
            <span className="ml-1 font-sans text-[10px] text-[#71717a]"> · {unit}</span>
          ) : null}
        </p>
        <p className="truncate text-[10px] text-[#71717a]">{label}</p>
      </div>
      <span className="shrink-0 text-[10px] text-cyan-300/80">Add</span>
    </button>
  );
}
