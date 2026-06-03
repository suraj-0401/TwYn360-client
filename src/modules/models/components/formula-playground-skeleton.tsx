"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Loader2, Play, Save, Search, Send, X } from "lucide-react";
import dynamic from "next/dynamic";
import katex from "katex";
import { cn } from "@/lib/utils";
import type { Monaco } from "@monaco-editor/react";
import type { editor, IDisposable } from "monaco-editor";
import {
  normalizeFormulaPreview,
  parseFormulaPreview,
  type SimulationValidationError,
} from "@/services/simulation-formula.service";
import {
  toDisplayFormulaExpression,
  toParseFormulaExpression,
  toStoredFormulaExpression,
} from "@/modules/models/utils/formula-expression";
import {
  FORMULA_DSL_FUNCTIONS,
  FORMULA_TOOLBAR_GROUPS,
} from "@/modules/models/constants/formula-dsl";
import { evaluateFormulaSandbox } from "@/modules/models/utils/formula-sandbox-eval";
import {
  classifyFormulaDependencies,
  parametersToSimulationPayload,
} from "@/modules/models/utils/formula-parameters";
import type { FormulaParameterInput } from "@/types/formula";
import type { SimulationDependencySummary } from "@/services/simulation-formula.service";
import type { FormulaVariablePoolItem } from "@/modules/models/utils/formula-variable-pool";
import { filterNumericFormulaPool } from "@/modules/models/utils/formula-numeric-pool";
import {
  describeParameterSource,
  describePoolItemSource,
  resolvePoolItemForParameter,
} from "@/modules/models/utils/formula-pool-labels";
import {
  buildUnitByAlias,
  formatUnitLabel,
  formatValueWithUnit,
  resolveParameterUnit,
} from "@/modules/models/utils/formula-unit-display";

type ParseMetadata = {
  variables: string[];
  functions: string[];
  operators: string[];
};

export type FormulaStudioProps = {
  targetLabel: string;
  targetAlias: string;
  /** Outcome / derived factor output unit (e.g. kg/m² for BMI). */
  targetUnitCode?: string | null;
  initialExpression?: string;
  onSaveDraft?: (storedExpression: string) => Promise<void>;
  onSubmitForReview?: (storedExpression: string) => Promise<void>;
  isSavingDraft?: boolean;
  isSubmittingReview?: boolean;
  canSubmitForReview?: boolean;
  submitDisabledReason?: string;
  governanceStatus?: string | null;
  governanceVersion?: number | null;
  governanceUpdatedAt?: string | null;
  governanceReason?: string | null;
  onParseUpdate?: (payload: {
    status: ValidateState;
    dependencies: string[];
    dependencySummary: SimulationDependencySummary;
    errors: SimulationValidationError[];
  }) => void;
  variablePool?: FormulaVariablePoolItem[];
  formulaParameters: FormulaParameterInput[];
};

type ValidateState = "idle" | "validating" | "valid" | "broken" | "offline";
type MonacoMarkerData = {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: number;
};
type TemplatePreset = { id: string; label: string; expression: string };

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const FORMULA_LANGUAGE_ID = "formulaDsl";
const MARKER_OWNER = "formula-playground";

function registerFormulaMonacoLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: FORMULA_LANGUAGE_ID });
  monaco.languages.setMonarchTokensProvider(FORMULA_LANGUAGE_ID, {
    tokenizer: {
      root: [
        [/[a-zA-Z_]\w*/, "identifier"],
        [/\d+(\.\d+)?/, "number"],
        [/[+*/^=-]/, "operator"],
        [/[()]/, "delimiter.parenthesis"],
      ],
    },
  });
}

function extractLocalDependencies(expression: string, aliases: string[]): string[] {
  return aliases.filter((alias) => {
    if (!alias.trim()) {
      return false;
    }
    return new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(expression);
  });
}

function severityTone(severity?: string):
  | "error"
  | "warning"
  | "info" {
  const normalized = (severity ?? "error").toLowerCase();
  if (normalized === "warning") return "warning";
  if (normalized === "info") return "info";
  return "error";
}

function markerSeverity(monaco: Monaco, severity?: string): number {
  const normalized = severityTone(severity);
  if (normalized === "warning") return monaco.MarkerSeverity.Warning;
  if (normalized === "info") return monaco.MarkerSeverity.Info;
  return monaco.MarkerSeverity.Error;
}

const PARSE_DEBOUNCE_MS = 400;

function parameterDetailLine(
  param: FormulaParameterInput,
  unit: string | null,
  poolByAlias: Map<string, FormulaVariablePoolItem>,
): string {
  if (param.type === "STATIC") {
    const value = param.defaultValue ?? "?";
    return unit ? `constant · ${value} ${unit}` : `constant · ${value}`;
  }
  const source = describeParameterSource(param, poolByAlias);
  return unit ? `${source} · ${unit}` : source;
}

export function FormulaStudio({
  targetLabel,
  targetAlias,
  targetUnitCode = null,
  initialExpression,
  onSaveDraft,
  onSubmitForReview,
  isSavingDraft = false,
  isSubmittingReview = false,
  canSubmitForReview = true,
  submitDisabledReason,
  governanceStatus,
  governanceVersion,
  governanceUpdatedAt,
  governanceReason,
  onParseUpdate,
  variablePool = [],
  formulaParameters,
}: FormulaStudioProps) {
  const targetUnitLabel = formatUnitLabel(targetUnitCode);
  const numericPool = useMemo(
    () => filterNumericFormulaPool(variablePool),
    [variablePool],
  );
  const unitByAlias = useMemo(() => buildUnitByAlias(numericPool), [numericPool]);
  const variableByAlias = useMemo(
    () => new Map(numericPool.map((item) => [item.alias, item])),
    [numericPool],
  );
  const poolByAlias = useMemo(
    () => new Map(variablePool.map((item) => [item.alias, item])),
    [variablePool],
  );

  const emptyDisplayExpression = useMemo(
    () => toDisplayFormulaExpression(targetAlias, ""),
    [targetAlias],
  );
  const [expression, setExpression] = useState(
    initialExpression !== undefined
      ? toDisplayFormulaExpression(targetAlias, initialExpression)
      : emptyDisplayExpression,
  );
  const [inputSearch, setInputSearch] = useState("");
  const [parseMetadata, setParseMetadata] = useState<ParseMetadata | null>(null);
  const [sandboxDraft, setSandboxDraft] = useState<Record<string, string>>({});
  const [sandboxRun, setSandboxRun] = useState<{
    status: "idle" | "success" | "error";
    value?: number;
    message?: string;
  }>({ status: "idle" });
  const [diagnostics, setDiagnostics] = useState<SimulationValidationError[]>([]);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [dependencySummary, setDependencySummary] =
    useState<SimulationDependencySummary | null>(null);
  const [validateState, setValidateState] = useState<ValidateState>("idle");
  const [monacoReady, setMonacoReady] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const completionRef = useRef<IDisposable | null>(null);
  const hoverProviderRef = useRef<IDisposable | null>(null);

  useEffect(() => {
    setExpression(
      initialExpression !== undefined
        ? toDisplayFormulaExpression(targetAlias, initialExpression)
        : emptyDisplayExpression,
    );
  }, [emptyDisplayExpression, initialExpression, targetAlias]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const param of formulaParameters) {
      if (param.type === "STATIC" && param.defaultValue !== undefined) {
        next[param.alias] = String(param.defaultValue);
      } else if (sandboxDraft[param.alias] !== undefined) {
        next[param.alias] = sandboxDraft[param.alias];
      } else {
        next[param.alias] = "";
      }
    }
    setSandboxDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync keys when parameter list changes
  }, [formulaParameters.map((p) => p.alias).join("|")]);

  const declaredAliases = useMemo(
    () => formulaParameters.map((param) => param.alias),
    [formulaParameters],
  );

  const parseBody = useMemo(
    () => toParseFormulaExpression(expression, targetAlias),
    [expression, targetAlias],
  );

  /** Parameters referenced in the current expression (sandbox only needs these). */
  const sandboxParameters = useMemo(() => {
    const used = new Set<string>();
    if (dependencySummary) {
      for (const alias of dependencySummary.usedDynamic) {
        used.add(alias);
      }
      for (const alias of dependencySummary.usedStatic) {
        used.add(alias);
      }
    }
    if (parseMetadata?.variables.length) {
      for (const alias of parseMetadata.variables) {
        used.add(alias);
      }
    }
    if (used.size === 0 && parseBody) {
      for (const alias of extractLocalDependencies(parseBody, declaredAliases)) {
        used.add(alias);
      }
    }
    if (used.size === 0) {
      return [];
    }
    return formulaParameters.filter((param) => used.has(param.alias));
  }, [declaredAliases, dependencySummary, formulaParameters, parseBody, parseMetadata]);

  function buildSandboxNumericBindings(): Record<string, number> | null {
    const bindings: Record<string, number> = {};
    const missing: string[] = [];
    for (const param of sandboxParameters) {
      const raw = sandboxDraft[param.alias]?.trim() ?? "";
      let value = raw === "" ? NaN : Number(raw);
      if (Number.isNaN(value) && param.type === "STATIC" && param.defaultValue !== undefined) {
        value = param.defaultValue;
      }
      if (Number.isNaN(value)) {
        missing.push(param.alias);
      } else {
        bindings[param.alias] = value;
      }
    }
    if (missing.length > 0) {
      setSandboxRun({
        status: "error",
        message: `Enter numeric values for: ${missing.join(", ")}`,
      });
      return null;
    }
    return bindings;
  }

  function runSandboxTest() {
    if (!parseBody) {
      setSandboxRun({ status: "error", message: "Enter a valid formula before running a test." });
      return;
    }
    if (sandboxParameters.length === 0) {
      setSandboxRun({
        status: "error",
        message: "No parameters are used in the expression yet.",
      });
      return;
    }
    const bindings = buildSandboxNumericBindings();
    if (!bindings) {
      return;
    }
    const result = evaluateFormulaSandbox(parseBody, bindings);
    if (result.ok) {
      setSandboxRun({ status: "success", value: result.value });
    } else {
      setSandboxRun({ status: "error", message: result.error });
    }
  }

  useEffect(() => {
    setSandboxRun({ status: "idle" });
  }, [parseBody]);

  const searchLower = inputSearch.trim().toLowerCase();

  const availableTransformationFactors = useMemo(
    () =>
      numericPool.filter(
        (item) =>
          item.sourceType === "DERIVED_FACTOR" &&
          item.derivedFactorType === "categorical_mapping" &&
          !formulaParameters.some((param) => param.alias === item.alias),
      ),
    [formulaParameters, numericPool],
  );

  const filteredInsertables = useMemo(() => {
    const items: Array<{ kind: "param" | "fn" | "op"; label: string; insert: string; detail?: string }> =
      [];
    for (const param of formulaParameters) {
      const unit = resolveParameterUnit(param, unitByAlias);
      items.push({
        kind: "param",
        label: param.alias,
        insert: param.alias,
        detail: parameterDetailLine(param, unit, poolByAlias),
      });
    }
    for (const group of FORMULA_TOOLBAR_GROUPS) {
      for (const token of group.tokens) {
        items.push({ kind: group.label === "Arithmetic" ? "op" : "fn", label: token, insert: token });
      }
    }
    if (!searchLower) {
      return items;
    }
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchLower) ||
        (item.detail?.toLowerCase().includes(searchLower) ?? false),
    );
  }, [formulaParameters, poolByAlias, searchLower, unitByAlias]);

  const templateOptions = useMemo<TemplatePreset[]>(() => {
    const [first, second] = numericPool;
    if (!first) {
      return [];
    }
    const a = first.alias;
    const b = second?.alias ?? "beta";
    return [
      {
        id: "generic-ratio",
        label: "Ratio (BMI-style)",
        expression: second
          ? `${targetAlias} = ${a} / (${b} ^ 2)`
          : `${targetAlias} = ${a}`,
      },
      {
        id: "generic-linear",
        label: "Linear combination",
        expression: second ? `${targetAlias} = ${a} + ${b}` : `${targetAlias} = ${a}`,
      },
      {
        id: "generic-logistic",
        label: "Logistic curve",
        expression: `${targetAlias} = 1 / (1 + exp(-${a}))`,
      },
      {
        id: "generic-product",
        label: "Product",
        expression: second ? `${targetAlias} = ${a} * ${b}` : `${targetAlias} = ${a}`,
      },
    ];
  }, [numericPool, targetAlias]);

  function applyEditorValue(nextValue: string) {
    setExpression(nextValue);
    const currentModel = editorRef.current?.getModel();
    if (currentModel && currentModel.getValue() !== nextValue) {
      currentModel.setValue(nextValue);
    }
  }

  function insertToken(token: string) {
    const editorInstance = editorRef.current;
    const model = editorInstance?.getModel();
    if (!editorInstance || !model) {
      setExpression((current) => `${current}${current.endsWith(" ") ? "" : " "}${token}`);
      return;
    }

    const selection = editorInstance.getSelection();
    if (!selection) return;
    editorInstance.executeEdits("formula-token", [{ range: selection, text: token }]);
    editorInstance.focus();
    setExpression(model.getValue());
  }

  useEffect(() => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;

    const markers: MonacoMarkerData[] = diagnostics.map((item) => {
      if (typeof item.startIndex === "number" && typeof item.endIndex === "number") {
        const start = model.getPositionAt(Math.max(0, item.startIndex));
        const end = model.getPositionAt(Math.max(item.startIndex + 1, item.endIndex));
        return {
          startLineNumber: start.lineNumber,
          startColumn: start.column,
          endLineNumber: end.lineNumber,
          endColumn: end.column,
          message: item.message,
          severity: markerSeverity(monaco, item.severity),
        };
      }
      return {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: Math.max(2, expression.length + 1),
        message: item.message,
        severity: markerSeverity(monaco, item.severity),
      };
    });

    monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
  }, [diagnostics, expression]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco || !monacoReady) return;

    completionRef.current?.dispose();
        const functions = [...FORMULA_DSL_FUNCTIONS];
    completionRef.current = monaco.languages.registerCompletionItemProvider(
      FORMULA_LANGUAGE_ID,
      {
        triggerCharacters: ["(", "_"],
        provideCompletionItems(
          model: editor.ITextModel,
          position: { lineNumber: number; column: number },
        ) {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const variableItems = formulaParameters.map((item) => ({
            label: item.alias,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: item.alias,
            detail:
              item.type === "STATIC"
                ? "constant"
                : describeParameterSource(item, poolByAlias),
            range,
          }));
          const functionItems = functions.map((name) => ({
            label: `${name}()`,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: `${name}($1)`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          }));
          const templateItem = templateOptions[0];
          const suggestions = [
            ...variableItems,
            ...functionItems,
            ...(templateItem
              ? [
                  {
                    label: "formula-template",
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: templateItem.expression,
                    range,
                  },
                ]
              : []),
          ];
          return { suggestions };
        },
      },
    );

    return () => {
      completionRef.current?.dispose();
      completionRef.current = null;
    };
  }, [formulaParameters, monacoReady, poolByAlias, templateOptions]);

  useEffect(() => {
    const monaco = monacoRef.current;
    const editorInstance = editorRef.current;
    const model = editorInstance?.getModel();
    if (!monaco || !monacoReady || !model) return;

    hoverProviderRef.current?.dispose();

    hoverProviderRef.current = monaco.languages.registerHoverProvider(
      FORMULA_LANGUAGE_ID,
      {
        provideHover(
          hoverModel: editor.ITextModel,
          position: { lineNumber: number; column: number },
        ) {
          const word = hoverModel.getWordAtPosition(position);
          if (!word?.word) return null;
          try {
            const tokenHtml = katex.renderToString(word.word, {
              throwOnError: false,
              strict: "ignore",
            });
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [
                { value: `**Token**: \`${word.word}\`` },
                { value: tokenHtml },
              ],
            };
          } catch {
            return null;
          }
        },
      },
    );

    return () => {
      hoverProviderRef.current?.dispose();
      hoverProviderRef.current = null;
    };
  }, [monacoReady]);

  useEffect(() => {
    const body = toParseFormulaExpression(expression, targetAlias);
    if (!body) {
      setValidateState("idle");
      setParseMetadata(null);
      setDiagnostics([]);
      setDependencies([]);
      setDependencySummary(null);
      return;
    }

    const timer = setTimeout(async () => {
      const simulationPayload = parametersToSimulationPayload(formulaParameters);
      const knownAliases = declaredAliases;

      setValidateState("validating");
      try {
        const normalized = await normalizeFormulaPreview({
          expression: body,
          knownAliases,
          knownParameters: simulationPayload.knownParameters,
        });

        let nextDiagnostics = normalized.diagnostics ?? [];
        let deps =
          normalized.parseMetadata.variables.length > 0
            ? normalized.parseMetadata.variables
            : extractLocalDependencies(body, knownAliases);

        const hasNormalizeError = nextDiagnostics.some(
          (item) => severityTone(item.severity) === "error",
        );

        let summary = classifyFormulaDependencies(deps, formulaParameters);

        if (!hasNormalizeError) {
          const parseResult = await parseFormulaPreview({
            expression: body,
            knownVariables: simulationPayload.knownVariables,
            knownParameters: simulationPayload.knownParameters,
          });

          nextDiagnostics = [...nextDiagnostics, ...(parseResult.errors ?? [])];
          if ((parseResult.dependencies ?? []).length > 0) {
            deps = (parseResult.dependencies ?? []).map((dep) => dep.alias);
          }

          summary =
            parseResult.dependencySummary ??
            classifyFormulaDependencies(deps, formulaParameters);
        }

        setParseMetadata({
          variables: normalized.parseMetadata.variables,
          functions: normalized.parseMetadata.functions,
          operators: normalized.parseMetadata.operators,
        });
        setDiagnostics(nextDiagnostics);
        setDependencies(deps);
        setDependencySummary(summary);

        const hasError = nextDiagnostics.some(
          (item) => severityTone(item.severity) === "error",
        );
        const nextState: ValidateState = hasError ? "broken" : "valid";
        setValidateState(nextState);
        onParseUpdate?.({
          status: nextState,
          dependencies: deps,
          dependencySummary: summary,
          errors: nextDiagnostics,
        });
      } catch {
        setValidateState("offline");
        const offlineDiagnostics = [
          {
            type: "SERVICE_UNAVAILABLE",
            message:
              "Simulation service is unreachable. Start simulation-service to enable live validation.",
            severity: "WARNING",
          },
        ];
        setDiagnostics(offlineDiagnostics);
        onParseUpdate?.({
          status: "offline",
          dependencies: [],
          dependencySummary: {
            usedDynamic: [],
            usedStatic: [],
            undeclared: [],
            unusedDeclared: [],
          },
          errors: offlineDiagnostics,
        });
      }
    }, PARSE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [
    declaredAliases,
    expression,
    formulaParameters,
    onParseUpdate,
    targetAlias,
  ]);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#121214]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#f4f4f5]">
            Step 3 — Formula Studio
          </p>
          <p className="mt-0.5 truncate text-xs text-[#71717a]">
            {targetLabel} · <span className="font-mono">{targetAlias}</span> · draft v
            {governanceVersion ?? 1}
          </p>
          <p className="mt-1 text-[10px] text-[#52525b]">
            Numeric inputs only — use transformation outputs (e.g. rs_test), not raw enums.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const stored = toStoredFormulaExpression(expression, targetAlias);
              if (onSaveDraft && stored) {
                void onSaveDraft(stored).catch(() => undefined);
              }
            }}
            disabled={isSavingDraft || !toStoredFormulaExpression(expression, targetAlias)}
            className="inline-flex items-center gap-1 rounded-md border border-white/[0.12] bg-white/[0.02] px-3 py-1.5 text-xs text-[#e4e4e7] hover:bg-white/[0.06]"
          >
            {isSavingDraft ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save draft
          </button>
          <button
            type="button"
            onClick={() => {
              if (!onSubmitForReview) {
                return;
              }
              const stored = toStoredFormulaExpression(expression, targetAlias);
              if (!stored) {
                return;
              }
              void onSubmitForReview(stored).catch(() => undefined);
            }}
            disabled={isSubmittingReview || !canSubmitForReview}
            title={!canSubmitForReview ? submitDisabledReason : undefined}
            className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] px-3 py-1.5 text-xs text-[#a1a1aa] disabled:opacity-50"
          >
            {isSubmittingReview ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Submit
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 overflow-hidden grid-cols-1 grid-rows-[auto_auto_auto] lg:grid-cols-[minmax(200px,240px)_minmax(0,1fr)_minmax(260px,320px)] lg:grid-rows-1">
        {/* LEFT — Inputs */}
        <aside className="flex max-h-[min(280px,38vh)] min-h-0 flex-col overflow-hidden border-b border-white/[0.08] lg:max-h-none lg:border-r lg:border-b-0">
          <div className="shrink-0 border-b border-white/[0.08] p-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
              Inputs
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute top-2 left-2 size-3.5 text-[#52525b]" />
              <input
                type="search"
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                placeholder="Search parameters, functions…"
                className="w-full rounded-md border border-white/10 bg-white/[0.03] py-1.5 pr-8 pl-8 text-xs text-zinc-200"
              />
              {inputSearch ? (
                <button
                  type="button"
                  onClick={() => setInputSearch("")}
                  className="absolute top-2 right-2 text-[#71717a] hover:text-zinc-300"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain p-3 [-webkit-overflow-scrolling:touch]">
            {formulaParameters.length === 0 ? (
              <p className="text-[10px] text-amber-200/80">
                No parameters declared. Go back to Step 2 — Parameters.
              </p>
            ) : (
              <div>
                <p className="mb-1.5 text-[9px] uppercase tracking-wide text-[#52525b]">
                  Parameters
                </p>
                {filteredInsertables
                  .filter((item) => item.kind === "param")
                  .map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => insertToken(item.insert)}
                      className="mb-1 flex w-full flex-col rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1.5 text-left hover:bg-white/[0.06]"
                    >
                      <span className="font-mono text-xs text-[#e4e4e7]">{item.label}</span>
                      {item.detail ? (
                        <span className="text-[10px] text-[#71717a]">{item.detail}</span>
                      ) : null}
                    </button>
                  ))}
              </div>
            )}
            {availableTransformationFactors.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[9px] uppercase tracking-wide text-[#52525b]">
                  Add in Parameters first
                </p>
                {availableTransformationFactors.map((item) => (
                  <div
                    key={item.derivedFactorId ?? item.alias}
                    className="mb-1 rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2 py-1.5"
                  >
                    <span className="font-mono text-xs text-cyan-100/90">{item.alias}</span>
                    <span className="block text-[10px] text-[#71717a]">
                      {item.label} · transform
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            <div>
              <p className="mb-1.5 text-[9px] uppercase tracking-wide text-[#52525b]">
                Functions
              </p>
              <div className="flex flex-wrap gap-1">
                {filteredInsertables
                  .filter((item) => item.kind === "fn")
                  .map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => insertToken(item.insert)}
                      className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 hover:bg-white/[0.08]"
                    >
                      {item.label}
                    </button>
                  ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[9px] uppercase tracking-wide text-[#52525b]">
                Operators
              </p>
              <div className="flex flex-wrap gap-1">
                {filteredInsertables
                  .filter((item) => item.kind === "op")
                  .map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => insertToken(item.insert)}
                      className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 hover:bg-white/[0.08]"
                    >
                      {item.label}
                    </button>
                  ))}
              </div>
            </div>
            {templateOptions.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[9px] uppercase tracking-wide text-[#52525b]">
                  Templates
                </p>
                {templateOptions.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyEditorValue(template.expression)}
                    className="mb-1 w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1.5 text-left text-[10px] text-[#a1a1aa] hover:bg-white/[0.06]"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </aside>

        {/* CENTER — Editor */}
        <div className="flex min-h-[min(320px,45vh)] min-w-0 flex-col overflow-hidden border-b border-white/[0.08] lg:min-h-0 lg:flex-1 lg:border-b-0">
          <div className="shrink-0 border-b border-white/[0.08] px-4 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
              Formula editor
            </p>
            <p className="font-mono text-xs text-[#a1a1aa]">
              {targetAlias} = <span className="text-[#52525b]">ASCII DSL</span>
              {targetUnitLabel ? (
                <span className="text-[#71717a]"> · output unit: {targetUnitLabel}</span>
              ) : null}
            </p>
          </div>
          <div className="min-h-0 flex-1 p-3">
            <div className="h-full min-h-[280px] overflow-hidden rounded-md border border-white/[0.08] bg-[#0b0b0d]">
              <MonacoEditor
                height="100%"
                language={FORMULA_LANGUAGE_ID}
                theme="vs-dark"
                value={expression}
                beforeMount={registerFormulaMonacoLanguage}
                onMount={(editorInstance, monaco) => {
                  editorRef.current = editorInstance;
                  monacoRef.current = monaco;
                  setMonacoReady(true);
                }}
                onChange={(value) => applyEditorValue(value ?? "")}
                options={{
                  minimap: { enabled: false },
                  wordWrap: "on",
                  lineNumbers: "on",
                  fontSize: 14,
                  automaticLayout: true,
                  suggestOnTriggerCharacters: true,
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT — output unit + test */}
        <aside className="flex max-h-[min(360px,48vh)] min-h-0 flex-col overflow-hidden bg-[#0f0f11] lg:max-h-none lg:border-l lg:border-white/[0.08]">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain p-3 text-xs [-webkit-overflow-scrolling:touch]">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#71717a]">
                Output unit
              </p>
              {targetUnitLabel ? (
                <p className="font-mono text-sm text-[#e4e4e7]">{targetUnitLabel}</p>
              ) : (
                <p className="text-[10px] text-[#71717a]">Not set on this outcome.</p>
              )}
            </div>

            <StudioSection title="Test">
              {sandboxParameters.length === 0 ? (
                <p className="text-[10px] text-[#71717a]">
                  Use parameters in the formula to enable testing.
                </p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {sandboxParameters.map((param) => {
                      const unit = resolveParameterUnit(param, unitByAlias);
                      const variable = resolvePoolItemForParameter(param, numericPool);
                      const enumOptions = variable?.enumOptions ?? [];
                      const enumValueToNumber = variable?.enumValueToNumber ?? {};
                      return (
                        <label key={param.alias} className="block">
                          <span className="mb-0.5 flex flex-wrap items-baseline gap-1 font-mono text-[10px] text-[#a1a1aa]">
                            {param.alias}
                            {unit ? (
                              <span className="font-sans text-[#52525b]">({unit})</span>
                            ) : null}
                            {variable ? (
                              <span className="font-sans text-[#52525b]">
                                · {describePoolItemSource(variable)}
                              </span>
                            ) : null}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {enumOptions.length > 0 ? (
                              <select
                                value={sandboxDraft[param.alias] ?? ""}
                                onChange={(e) => {
                                  setSandboxRun({ status: "idle" });
                                  setSandboxDraft((prev) => ({
                                    ...prev,
                                    [param.alias]: e.target.value,
                                  }));
                                }}
                                className="min-w-0 flex-1 rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-zinc-200"
                              >
                                <option value="">
                                  {variable?.derivedFactorType === "categorical_mapping"
                                    ? "Select mapped value"
                                    : "Select value"}
                                </option>
                                {enumOptions.map((option) => (
                                  <option
                                    key={`${param.alias}-${option.value}`}
                                    value={
                                      enumValueToNumber[option.value] !== undefined
                                        ? String(enumValueToNumber[option.value])
                                        : option.value
                                    }
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                inputMode="decimal"
                                value={sandboxDraft[param.alias] ?? ""}
                                onChange={(e) => {
                                  setSandboxRun({ status: "idle" });
                                  setSandboxDraft((prev) => ({
                                    ...prev,
                                    [param.alias]: e.target.value,
                                  }));
                                }}
                                placeholder={
                                  param.type === "STATIC"
                                    ? String(param.defaultValue ?? "0")
                                    : "0"
                                }
                                className="min-w-0 flex-1 rounded border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-zinc-200"
                              />
                            )}
                            {unit ? (
                              <span className="shrink-0 text-[10px] font-medium text-[#71717a]">
                                {unit}
                              </span>
                            ) : null}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={runSandboxTest}
                    disabled={!parseBody || validateState === "broken"}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Play className="size-3.5" />
                    Run test
                  </button>

                  {sandboxRun.status === "success" ? (
                    <p className="mt-2 font-mono text-base text-cyan-100">
                      {formatValueWithUnit(
                        sandboxRun.value?.toPrecision(6) ?? "",
                        targetUnitLabel,
                      )}
                    </p>
                  ) : null}
                  {sandboxRun.status === "error" ? (
                    <p className="mt-2 text-[11px] text-amber-200/90">{sandboxRun.message}</p>
                  ) : null}
                </>
              )}
            </StudioSection>
          </div>
        </aside>
      </div>
    </section>
  );
}

function StudioSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#71717a]">
        {title}
      </p>
      {children}
    </section>
  );
}

/** @deprecated Use FormulaStudio */
export const FormulaPlaygroundSkeleton = FormulaStudio;