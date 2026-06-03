"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FormulaParameterInput } from "@/types/formula";
import {
  poolItemKey,
  type FormulaVariablePoolItem,
} from "@/modules/models/utils/formula-variable-pool";
import { isNumericDataTypeCode } from "@/modules/models/utils/formula-numeric-pool";
import {
  buildUnitByAlias,
  formatUnitLabel,
  resolveParameterUnit,
} from "@/modules/models/utils/formula-unit-display";
import { describeParameterSource } from "@/modules/models/utils/formula-pool-labels";

const panelClass = "rounded-xl border border-white/[0.08] bg-[#121214]";
const inputClass =
  "border-white/10 bg-white/[0.03] text-zinc-200 placeholder:text-[#52525b]";

type FormulaParametersStepProps = {
  variablePool: FormulaVariablePoolItem[];
  parameters: FormulaParameterInput[];
  onChange: (parameters: FormulaParameterInput[]) => void;
  readOnly?: boolean;
};

type DeclaredFilter = "dynamic" | "static";

export function FormulaParametersStep({
  variablePool,
  parameters,
  onChange,
  readOnly = false,
}: FormulaParametersStepProps) {
  const [staticAliasDraft, setStaticAliasDraft] = useState("");
  const [staticValueDraft, setStaticValueDraft] = useState("");
  const [editingAlias, setEditingAlias] = useState<string | null>(null);
  const [editAliasDraft, setEditAliasDraft] = useState("");
  const [editValueDraft, setEditValueDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [declaredSearch, setDeclaredSearch] = useState("");
  const [declaredFilter, setDeclaredFilter] = useState<DeclaredFilter>("dynamic");

  const numericPool = useMemo(
    () =>
      variablePool.filter((item) => {
        if (item.sourceType === "DERIVED_FACTOR") {
          return true;
        }
        return isNumericDataTypeCode(item.dataTypeCode);
      }),
    [variablePool],
  );

  const dynamicPoolAvailable = useMemo(
    () =>
      numericPool.filter(
        (item) => !parameters.some((param) => param.alias === item.alias),
      ),
    [numericPool, parameters],
  );

  const unitByAlias = useMemo(() => buildUnitByAlias(variablePool), [variablePool]);
  const poolByAlias = useMemo(
    () => new Map(variablePool.map((item) => [item.alias, item])),
    [variablePool],
  );

  const factorInstances = dynamicPoolAvailable.filter(
    (item) => item.sourceType === "FACTOR_INSTANCE",
  );
  const transformationFactors = dynamicPoolAvailable.filter(
    (item) =>
      item.sourceType === "DERIVED_FACTOR" &&
      item.derivedFactorType === "categorical_mapping",
  );
  const formulaDerivedFactors = dynamicPoolAvailable.filter(
    (item) =>
      item.sourceType === "DERIVED_FACTOR" &&
      item.derivedFactorType !== "categorical_mapping",
  );

  const enumSourcesWithoutMapping = useMemo(() => {
    return variablePool.filter((item) => {
      if (item.sourceType !== "FACTOR_INSTANCE") {
        return false;
      }
      if (isNumericDataTypeCode(item.dataTypeCode)) {
        return false;
      }
      return !item.mappedDerivedFactorId;
    });
  }, [variablePool]);

  const filterCounts = useMemo(
    () => ({
      dynamic: parameters.filter((p) => p.type === "DYNAMIC").length,
      static: parameters.filter((p) => p.type === "STATIC").length,
    }),
    [parameters],
  );

  const filteredDeclared = useMemo(() => {
    const query = declaredSearch.trim().toLowerCase();
    return parameters.filter((param) => {
      if (declaredFilter === "dynamic" && param.type !== "DYNAMIC") {
        return false;
      }
      if (declaredFilter === "static" && param.type !== "STATIC") {
        return false;
      }
      if (!query) {
        return true;
      }
      const source = describeParameterSource(param, poolByAlias).toLowerCase();
      return (
        param.alias.toLowerCase().includes(query) ||
        source.includes(query) ||
        (param.label?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [parameters, declaredFilter, declaredSearch, poolByAlias]);

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
    if (editingAlias === alias) {
      cancelEditStatic();
    }
    onChange(parameters.filter((param) => param.alias !== alias));
  }

  function startEditStatic(param: FormulaParameterInput) {
    if (param.type !== "STATIC") {
      return;
    }
    setEditingAlias(param.alias);
    setEditAliasDraft(param.alias);
    setEditValueDraft(
      param.defaultValue !== undefined ? String(param.defaultValue) : "",
    );
    setEditError(null);
  }

  function cancelEditStatic() {
    setEditingAlias(null);
    setEditAliasDraft("");
    setEditValueDraft("");
    setEditError(null);
  }

  function saveStaticEdit(originalAlias: string) {
    const alias = editAliasDraft.trim();
    const value = Number(editValueDraft);
    if (!alias) {
      setEditError("Alias is required.");
      return;
    }
    if (Number.isNaN(value)) {
      setEditError("Enter a valid number.");
      return;
    }
    if (
      parameters.some(
        (param) => param.alias === alias && param.alias !== originalAlias,
      )
    ) {
      setEditError("Another parameter already uses this alias.");
      return;
    }
    onChange(
      parameters.map((param) =>
        param.alias === originalAlias && param.type === "STATIC"
          ? { ...param, alias, defaultValue: value }
          : param,
      ),
    );
    cancelEditStatic();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <header className="shrink-0">
        <h2 className="text-2xl font-semibold tracking-tight text-[#f4f4f5]">Parameters</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#71717a]">
          Add inputs and constants on the left. Review and manage everything you have declared on
          the right. Click Next to save.
        </p>
      </header>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Left — add from pool + constants */}
        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch]">
          <section className={cn(panelClass, "p-4")}>
            <h3 className="text-lg font-semibold text-[#f4f4f5]">Add parameters</h3>
            <p className="mt-1.5 text-sm text-[#71717a]">
              Numeric inputs from factor sets and derived factors.
            </p>

            <div className="mt-4 space-y-4">
              {numericPool.length === 0 ? (
                <p className="text-sm text-amber-200/90">
                  Attach factor sets and/or create transformation derived factors on this model
                  first.
                </p>
              ) : dynamicPoolAvailable.length === 0 ? (
                <p className="text-sm text-[#71717a]">All available inputs are declared.</p>
              ) : (
                <>
                  {factorInstances.length > 0 ? (
                    <PoolGroup title="Raw numeric" items={factorInstances} readOnly={readOnly} onAdd={addDynamic} />
                  ) : null}
                  {transformationFactors.length > 0 ? (
                    <PoolGroup
                      title="Transformation outputs"
                      items={transformationFactors}
                      readOnly={readOnly}
                      onAdd={addDynamic}
                    />
                  ) : null}
                  {formulaDerivedFactors.length > 0 ? (
                    <PoolGroup
                      title="Other derived factors"
                      items={formulaDerivedFactors}
                      readOnly={readOnly}
                      onAdd={addDynamic}
                    />
                  ) : null}
                </>
              )}
              {enumSourcesWithoutMapping.length > 0 ? (
                <p className="text-xs text-amber-300/90">
                  Set up transformations for:{" "}
                  {enumSourcesWithoutMapping.map((row) => row.alias).join(", ")}
                </p>
              ) : null}
            </div>
          </section>

          <section className={cn(panelClass, "p-4")}>
            <h3 className="text-lg font-semibold text-[#f4f4f5]">Add constant</h3>
            <p className="mt-1.5 text-sm text-[#71717a]">
              Fixed numeric coefficients used directly in your formula.
            </p>
            {!readOnly ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
                    Alias
                  </label>
                  <Input
                    value={staticAliasDraft}
                    onChange={(e) => setStaticAliasDraft(e.target.value)}
                    placeholder="e.g. intercept"
                    className={cn("mt-1.5 h-9 text-sm", inputClass)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
                    Value
                  </label>
                  <Input
                    type="number"
                    value={staticValueDraft}
                    onChange={(e) => setStaticValueDraft(e.target.value)}
                    placeholder="0"
                    className={cn("mt-1.5 h-9 text-sm", inputClass)}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full border-white/10 text-zinc-200 hover:bg-white/[0.06]"
                  onClick={addStatic}
                  disabled={
                    !staticAliasDraft.trim() ||
                    staticValueDraft === "" ||
                    Number.isNaN(Number(staticValueDraft))
                  }
                >
                  <Plus className="mr-1.5 size-4" />
                  Add constant
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#71717a]">Read-only.</p>
            )}
          </section>
        </div>

        {/* Right — declared list */}
        <section
          className={cn(panelClass, "flex min-h-0 flex-col overflow-hidden p-4")}
        >
          <div className="shrink-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold text-[#f4f4f5]">Declared parameters</h3>
              <span className="text-sm tabular-nums text-[#71717a]">
                {declaredSearch.trim()
                  ? `${filteredDeclared.length} matching`
                  : filterCounts[declaredFilter]}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-[#71717a]">
              Search and filter your declared inputs and constants.
            </p>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#52525b]" />
              <Input
                value={declaredSearch}
                onChange={(e) => setDeclaredSearch(e.target.value)}
                placeholder="Search by alias or source…"
                className={cn("h-9 pl-9 text-sm", inputClass)}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  { id: "dynamic" as const, label: "Dynamic" },
                  { id: "static" as const, label: "Static" },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setDeclaredFilter(chip.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    declaredFilter === chip.id
                      ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
                      : "border border-white/10 bg-white/[0.02] text-[#71717a] hover:text-[#d4d4d8]",
                  )}
                >
                  {chip.label}
                  <span className="ml-1.5 tabular-nums opacity-70">
                    {filterCounts[chip.id]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch]">
            {parameters.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#71717a]">
                No parameters declared yet. Add inputs or constants on the left.
              </p>
            ) : filteredDeclared.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#71717a]">
                {declaredSearch.trim()
                  ? "No parameters match your search."
                  : declaredFilter === "dynamic"
                    ? "No dynamic parameters declared yet."
                    : "No static constants declared yet."}
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredDeclared.map((param) => (
                  <DeclaredParameterRow
                    key={param.alias}
                    param={param}
                    unit={resolveParameterUnit(param, unitByAlias)}
                    poolByAlias={poolByAlias}
                    readOnly={readOnly}
                    editingAlias={editingAlias}
                    editAliasDraft={editAliasDraft}
                    editValueDraft={editValueDraft}
                    editError={editError}
                    onEditAliasDraftChange={(v) => {
                      setEditAliasDraft(v);
                      setEditError(null);
                    }}
                    onEditValueDraftChange={(v) => {
                      setEditValueDraft(v);
                      setEditError(null);
                    }}
                    onStartEdit={() => startEditStatic(param)}
                    onCancelEdit={cancelEditStatic}
                    onSaveEdit={() => saveStaticEdit(param.alias)}
                    onRemove={() => remove(param.alias)}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PoolGroup({
  title,
  items,
  readOnly,
  onAdd,
}: {
  title: string;
  items: FormulaVariablePoolItem[];
  readOnly: boolean;
  onAdd: (item: FormulaVariablePoolItem) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#52525b]">
        {title}
      </p>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <PoolCard
            key={poolItemKey(item)}
            alias={item.alias}
            label={item.label}
            unit={formatUnitLabel(item.unitCode)}
            hint={
              item.sourceType === "DERIVED_FACTOR" &&
              item.derivedFactorType === "categorical_mapping"
                ? "transform"
                : item.sourceType === "DERIVED_FACTOR"
                  ? "derived"
                  : "raw"
            }
            disabled={readOnly}
            onAdd={() => onAdd(item)}
          />
        ))}
      </div>
    </div>
  );
}

function DeclaredParameterRow({
  param,
  unit,
  poolByAlias,
  readOnly,
  editingAlias,
  editAliasDraft,
  editValueDraft,
  editError,
  onEditAliasDraftChange,
  onEditValueDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemove,
}: {
  param: FormulaParameterInput;
  unit: string | null;
  poolByAlias: Map<string, FormulaVariablePoolItem>;
  readOnly: boolean;
  editingAlias: string | null;
  editAliasDraft: string;
  editValueDraft: string;
  editError: string | null;
  onEditAliasDraftChange: (value: string) => void;
  onEditValueDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRemove: () => void;
}) {
  const isEditing =
    !readOnly && param.type === "STATIC" && editingAlias === param.alias;

  if (isEditing) {
    return (
      <li className="space-y-3 rounded-md border border-cyan-500/25 bg-cyan-500/5 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-cyan-200/80">
          Edit constant
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
              Alias
            </label>
            <Input
              value={editAliasDraft}
              onChange={(e) => onEditAliasDraftChange(e.target.value)}
              className={cn("mt-1.5 h-9 font-mono text-sm", inputClass)}
            />
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
              Value
            </label>
            <Input
              type="number"
              value={editValueDraft}
              onChange={(e) => onEditValueDraftChange(e.target.value)}
              className={cn("mt-1.5 h-9 text-sm", inputClass)}
            />
          </div>
        </div>
        {editAliasDraft.trim() !== param.alias ? (
          <p className="text-xs text-amber-300/85">
            Renaming updates this parameter only — update Formula Studio if the old alias appears
            in your expression.
          </p>
        ) : null}
        {editError ? <p className="text-xs text-rose-400">{editError}</p> : null}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
            onClick={onSaveEdit}
          >
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/10"
            onClick={onCancelEdit}
          >
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2">
      <div className="min-w-0">
        <p className="truncate font-mono text-xs text-[#e4e4e7]">{param.alias}</p>
        <p className="mt-0.5 text-[10px] text-[#71717a]">
          {param.type === "STATIC"
            ? `Value ${param.defaultValue ?? "—"}${unit ? ` · ${unit}` : ""}`
            : describeParameterSource(param, poolByAlias)}
          {param.type === "DYNAMIC" && unit ? ` · ${unit}` : ""}
        </p>
      </div>
      {!readOnly ? (
        <div className="flex shrink-0 items-center gap-2">
          {param.type === "STATIC" ? (
            <button
              type="button"
              disabled={editingAlias !== null}
              onClick={onStartEdit}
              className="text-[10px] text-[#71717a] hover:text-cyan-300 disabled:opacity-40"
            >
              Edit
            </button>
          ) : null}
          <button
            type="button"
            disabled={editingAlias !== null}
            onClick={onRemove}
            className="text-[10px] text-[#71717a] hover:text-rose-400 disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      ) : null}
    </li>
  );
}

function PoolCard({
  alias,
  label,
  unit,
  disabled,
  hint,
  onAdd,
}: {
  alias: string;
  label: string;
  unit: string | null;
  disabled: boolean;
  hint?: string;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAdd}
      className="flex w-full items-center justify-between gap-3 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-left hover:bg-white/[0.06] disabled:opacity-50"
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-xs text-[#e4e4e7]">
          {alias}
          {unit ? (
            <span className="ml-1 font-sans text-[10px] text-[#71717a]">· {unit}</span>
          ) : null}
        </p>
        <p className="truncate text-[10px] text-[#71717a]">{label}</p>
        {hint ? <p className="truncate text-[10px] text-cyan-300/70">{hint}</p> : null}
      </div>
      <span className="shrink-0 text-[10px] text-cyan-300/80">Add</span>
    </button>
  );
}
