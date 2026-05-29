"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Beaker,
  CircleAlert,
  CircleCheck,
  FileCheck2,
  Info,
  Link2,
  Loader2,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import katex from "katex";
import { cn } from "@/lib/utils";
import type { Monaco } from "@monaco-editor/react";
import type { editor, IDisposable } from "monaco-editor";
import {
  type SimulationKnownVariable,
  normalizeFormulaPreview,
  parseFormulaPreview,
  type SimulationValidationError,
} from "@/services/simulation-formula.service";

type FormulaPlaygroundSkeletonProps = {
  targetLabel: string;
  targetAlias: string;
  framework: string | null;
  frameworkOptions?: string[];
  onFrameworkChange?: (framework: string | null) => void;
  frameworkLocked?: boolean;
  initialExpression?: string;
  onSaveDraft?: (expression: string) => Promise<void>;
  onSubmitForReview?: () => Promise<void>;
  isSavingDraft?: boolean;
  isSubmittingReview?: boolean;
  canSubmitForReview?: boolean;
  governanceStatus?: string | null;
  governanceVersion?: number | null;
  governanceUpdatedAt?: string | null;
  governanceReason?: string | null;
  onParseUpdate?: (payload: {
    status: ValidateState;
    dependencies: string[];
    errors: SimulationValidationError[];
  }) => void;
  variablePool?: Array<{ alias: string; label: string; instanceId: string }>;
  /** Stacked = tools above editor (slide-overs). Split = side-by-side when container is wide. */
  layout?: "split" | "stacked";
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
type FormulaInputMode = "monaco" | "mathlive";
type MathfieldElement = HTMLElement & {
  value: string;
  getValue?: (format?: string) => string;
};

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

/** One-line summary; strips duplicate Suggestion lines already embedded in API messages. */
function diagnosticSummary(message: string): string {
  return message
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("Suggestion:"))
    .join(" · ");
}

function diagnosticHint(item: SimulationValidationError): string | null {
  const suggestion = item.suggestions?.[0]?.trim();
  if (!suggestion) {
    return null;
  }
  if (item.message.includes(suggestion) || /Suggestion:/i.test(item.message)) {
    return null;
  }
  return suggestion;
}

export function FormulaPlaygroundSkeleton({
  targetLabel,
  targetAlias,
  framework,
  frameworkOptions = [],
  onFrameworkChange,
  frameworkLocked = false,
  initialExpression,
  onSaveDraft,
  onSubmitForReview,
  isSavingDraft = false,
  isSubmittingReview = false,
  canSubmitForReview = true,
  governanceStatus,
  governanceVersion,
  governanceUpdatedAt,
  governanceReason,
  onParseUpdate,
  variablePool = [],
  layout = "split",
}: FormulaPlaygroundSkeletonProps) {
  const isStacked = layout === "stacked";
  const editorHeight = isStacked ? "280px" : "355px";
  const [activeTab, setActiveTab] = useState<"variables" | "templates" | "deps">(
    "variables",
  );
  const [expression, setExpression] = useState(
    initialExpression ?? `${targetAlias} = (weight / (height ^ 2))`,
  );
  const [diagnostics, setDiagnostics] = useState<SimulationValidationError[]>([]);
  const [dependencies, setDependencies] = useState<string[]>(["weight", "height"]);
  const [validateState, setValidateState] = useState<ValidateState>("idle");
  const [frameworkVersion, setFrameworkVersion] = useState("1");
  const [monacoReady, setMonacoReady] = useState(false);
  const [renderedMath, setRenderedMath] = useState("");
  const [inputMode, setInputMode] = useState<FormulaInputMode>("monaco");
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const completionRef = useRef<IDisposable | null>(null);
  const hoverProviderRef = useRef<IDisposable | null>(null);
  const mathfieldRef = useRef<MathfieldElement | null>(null);

  useEffect(() => {
    setExpression(initialExpression ?? `${targetAlias} = (weight / (height ^ 2))`);
  }, [initialExpression, targetAlias]);

  const variables = useMemo(() => {
    if (variablePool.length > 0) return variablePool;
    return [
      {
        alias: targetAlias,
        label: targetLabel,
        instanceId: "11111111-1111-1111-1111-111111111111",
      },
      { alias: "weight", label: "Weight", instanceId: "22222222-2222-2222-2222-222222222222" },
      { alias: "age", label: "Age", instanceId: "33333333-3333-3333-3333-333333333333" },
      {
        alias: "creatinine",
        label: "Creatinine",
        instanceId: "44444444-4444-4444-4444-444444444444",
      },
      { alias: "height", label: "Height", instanceId: "55555555-5555-5555-5555-555555555555" },
      { alias: "bmi", label: "BMI", instanceId: "66666666-6666-6666-6666-666666666666" },
    ];
  }, [targetAlias, targetLabel, variablePool]);

  const templatesByFramework = useMemo<Record<string, TemplatePreset[]>>(
    () => ({
      additive: [
        { id: "add-bmi", label: "BMI ratio", expression: `${targetAlias} = weight / (height ^ 2)` },
        {
          id: "add-logit",
          label: "Logit style",
          expression: `${targetAlias} = 1 / (1 + exp(-(weight + age)))`,
        },
      ],
      multiplicative: [
        { id: "mul-basic", label: "Weighted product", expression: `${targetAlias} = weight * creatinine` },
      ],
      logistic: [{ id: "log-basic", label: "Classic logistic", expression: `${targetAlias} = 1 / (1 + exp(-weight))` }],
      manual: [{ id: "manual", label: "Manual seed", expression: `${targetAlias} = weight` }],
    }),
    [targetAlias],
  );
  const genericTemplates: TemplatePreset[] = [
    { id: "generic-ratio", label: "Ratio (BMI-style)", expression: `${targetAlias} = weight / (height ^ 2)` },
    { id: "generic-linear", label: "Linear combination", expression: `${targetAlias} = weight + age` },
  ];
  const templateOptions = framework
    ? (templatesByFramework[framework] ?? genericTemplates)
    : genericTemplates;
  const operatorTokens = ["+", "-", "*", "/", "^", "(", ")", "sqrt()", "log()", "exp()", "abs()"];

  function applyEditorValue(nextValue: string) {
    setExpression(nextValue);
    const currentModel = editorRef.current?.getModel();
    if (currentModel && currentModel.getValue() !== nextValue) {
      currentModel.setValue(nextValue);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void import("mathlive").then(() => {
      if (!cancelled) {
        // Side-effect registers <math-field> custom element.
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mathfield = mathfieldRef.current;
    if (!mathfield) return;

    const onInput = () => {
      const next = mathfield.value ?? "";
      setExpression((previous) => (previous === next ? previous : next));
    };
    mathfield.addEventListener("input", onInput);
    return () => {
      mathfield.removeEventListener("input", onInput);
    };
  }, [inputMode]);

  useEffect(() => {
    const mathfield = mathfieldRef.current;
    if (!mathfield) return;
    if (mathfield.value !== expression) {
      mathfield.value = expression;
    }
  }, [expression, inputMode]);

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

  const tabs = [
    { key: "variables" as const, label: "Variables", icon: Link2 },
    { key: "templates" as const, label: "Templates", icon: Sparkles },
    { key: "deps" as const, label: "Deps", icon: FileCheck2 },
  ];

  useEffect(() => {
    try {
      const candidate = expression.split("=").slice(1).join("=").trim() || expression.trim();
      if (!candidate) {
        setRenderedMath("");
        return;
      }
      const html = katex.renderToString(candidate, {
        throwOnError: false,
        displayMode: false,
        strict: "ignore",
      });
      setRenderedMath(html);
    } catch {
      setRenderedMath("");
    }
  }, [expression]);

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
    const functions = ["sqrt", "log", "abs", "exp", "pow", "min", "max"];
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
          const variableItems = variables.map((item) => ({
            label: item.alias,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: item.alias,
            detail: item.label,
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
                    label: `${framework ?? "generic"}-template`,
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
  }, [framework, monacoReady, templateOptions, variables]);

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
    const current = expression.trim();
    if (!current) {
      return;
    }

    const timer = setTimeout(async () => {
      const knownAliases = variables.map((item) => item.alias);
      const knownVariables: SimulationKnownVariable[] = variables.map((item) => ({
        alias: item.alias,
        instanceId: item.instanceId,
      }));

      setValidateState("validating");
      try {
        const normalized = await normalizeFormulaPreview({
          expression: current,
          knownAliases,
          editorMode: inputMode,
        });

        let nextDiagnostics = normalized.diagnostics ?? [];
        let deps =
          normalized.parseMetadata.variables.length > 0
            ? normalized.parseMetadata.variables
            : extractLocalDependencies(current, knownAliases);

        const hasNormalizeError = nextDiagnostics.some(
          (item) => severityTone(item.severity) === "error",
        );

        if (!hasNormalizeError) {
          const parseResult = await parseFormulaPreview({
            framework: framework ?? undefined,
            frameworkVersion: framework ? frameworkVersion : undefined,
            expression: current,
            knownVariables,
          });

          if (parseResult.frameworkVersion && framework) {
            setFrameworkVersion(parseResult.frameworkVersion);
          }

          nextDiagnostics = [...nextDiagnostics, ...(parseResult.errors ?? [])];
          if ((parseResult.dependencies ?? []).length > 0) {
            deps = (parseResult.dependencies ?? []).map((dep) => dep.alias);
          }
        }

        setDiagnostics(nextDiagnostics);
        setDependencies(deps);

        const hasError = nextDiagnostics.some(
          (item) => severityTone(item.severity) === "error",
        );
        const nextState: ValidateState = hasError ? "broken" : "valid";
        setValidateState(nextState);
        onParseUpdate?.({
          status: nextState,
          dependencies: deps,
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
          errors: offlineDiagnostics,
        });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [expression, framework, frameworkVersion, inputMode, onParseUpdate, variables]);

  const statusLabel =
    validateState === "validating"
      ? "Validating"
      : validateState === "valid"
        ? "VALID"
        : validateState === "broken"
          ? "BROKEN"
          : validateState === "offline"
            ? "Offline"
            : "Not validated";

  const toolsTabBar = (
    <div
      className={cn(
        "flex shrink-0 items-stretch border-white/[0.08]",
        isStacked ? "border-b" : "border-b",
      )}
    >
      {tabs.map(({ key, label, icon: Icon }) => {
        const active = key === activeTab;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 border-b px-2 py-2.5 text-xs sm:flex-none sm:justify-start sm:px-3",
              active
                ? "border-[#f4f4f5] text-[#f4f4f5]"
                : "border-transparent text-[#71717a] hover:text-[#d4d4d8]",
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </button>
        );
      })}
    </div>
  );

  const toolsPanelBody = (
    <div
      className={cn(
        "space-y-2 overflow-y-auto p-3",
        isStacked ? "max-h-[min(180px,28vh)]" : "min-h-0 flex-1",
      )}
    >
      {activeTab === "variables" ? (
        <>
          {variables.map((variable) => (
            <button
              key={variable.alias}
              type="button"
              onClick={() => insertToken(variable.alias)}
              className="flex w-full items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1.5 text-left text-xs text-[#e4e4e7] hover:bg-white/[0.06]"
            >
              <div className="min-w-0">
                <p className="truncate">{variable.alias}</p>
                <p className="truncate text-[10px] text-[#71717a]">{variable.label}</p>
              </div>
              <span className="shrink-0 text-[10px] text-[#71717a]">Insert</span>
            </button>
          ))}
        </>
      ) : null}

      {activeTab === "templates" ? (
        <>
          {templateOptions.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyEditorValue(template.expression)}
              className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1.5 text-left text-xs text-[#e4e4e7] hover:bg-white/[0.06]"
            >
              <p>{template.label}</p>
              <p className="mt-1 text-[10px] text-zinc-400">{template.expression}</p>
            </button>
          ))}
        </>
      ) : null}

      {activeTab === "deps" ? (
        <div className="space-y-2">
          {dependencies.length === 0 ? (
            <p className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1.5 text-xs text-[#71717a]">
              No dependencies detected yet.
            </p>
          ) : (
            dependencies.map((dep) => (
              <div
                key={dep}
                className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1.5 text-xs text-[#e4e4e7]"
              >
                {dep}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );

  const toolsAside = (
    <aside
      className={cn(
        "flex min-w-0 flex-col",
        isStacked ? "border-b border-white/[0.08] bg-[#0f0f11]" : "min-h-0",
      )}
    >
      {toolsTabBar}
      {toolsPanelBody}
    </aside>
  );

  const operatorToolbar = (
    <div className="mb-3 overflow-x-auto pb-0.5">
      <div className="flex w-max min-w-full flex-nowrap gap-1.5">
        {operatorTokens.map((token) => (
          <button
            key={token}
            type="button"
            onClick={() => insertToken(token)}
            className="shrink-0 rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-zinc-300 hover:bg-white/[0.08]"
          >
            {token}
          </button>
        ))}
      </div>
    </div>
  );

  const editorSurface =
    inputMode === "monaco" ? (
      <div
        className="overflow-hidden rounded-md border border-white/[0.08] bg-[#0b0b0d]"
        style={{ height: editorHeight }}
      >
        <MonacoEditor
          height={editorHeight}
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
            fontSize: 13,
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
          }}
        />
      </div>
    ) : (
      <div
        className="overflow-auto rounded-md border border-white/[0.08] bg-[#0b0b0d] p-3"
        style={{ height: editorHeight }}
      >
        <math-field
          ref={(node) => {
            mathfieldRef.current = node as MathfieldElement | null;
          }}
          className="block min-h-[240px] w-full rounded border border-white/10 bg-[#0f0f12] p-3 text-base text-zinc-100"
        />
      </div>
    );

  const editorPanel = (
    <div
      className={cn(
        "min-w-0 p-3",
        !isStacked && "border-r border-white/[0.08]",
      )}
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#71717a]">
            Expression
          </p>
          <p className="mt-0.5 text-[11px] text-[#52525b]">{framework ?? "generic"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setInputMode("monaco")}
            className={cn(
              "rounded border px-2 py-1 text-[11px]",
              inputMode === "monaco"
                ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-200"
                : "border-white/10 bg-white/[0.03] text-zinc-300",
            )}
          >
            Monaco
          </button>
          <button
            type="button"
            onClick={() => setInputMode("mathlive")}
            className={cn(
              "rounded border px-2 py-1 text-[11px]",
              inputMode === "mathlive"
                ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-200"
                : "border-white/10 bg-white/[0.03] text-zinc-300",
            )}
          >
            MathLive
          </button>
        </div>
      </div>

      {operatorToolbar}
      {editorSurface}

      {renderedMath ? (
        <div className="mt-3 rounded-md border border-white/10 bg-[#0f0f12] p-3">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-zinc-400">Preview</p>
          <div
            className="overflow-x-auto text-zinc-100"
            dangerouslySetInnerHTML={{ __html: renderedMath }}
          />
        </div>
      ) : null}
    </div>
  );

  return (
    <section className="@container overflow-hidden rounded-xl border border-white/[0.08] bg-[#121214]">
      <div className="border-b border-white/[0.08] px-4 py-3">
        <div
          className={cn(
            "flex flex-col gap-3",
            !isStacked && "lg:flex-row lg:flex-wrap lg:items-start lg:justify-between",
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-[#f4f4f5]">
              {targetLabel} - Formula Editor
            </p>
            <p className="mt-1 text-xs text-[#a1a1aa]">
              {framework
                ? `${framework} framework strategy`
                : "Generic expression (no framework strategy)"}{" "}
              - draft v{governanceVersion ?? 1}
            </p>
          </div>

          <div
            className={cn(
              "flex flex-col gap-3",
              isStacked ? "w-full" : "w-full sm:w-auto sm:min-w-[200px] lg:max-w-[220px]",
            )}
          >
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-400">
                Framework strategy
              </label>
              <select
                value={framework ?? ""}
                onChange={(event) =>
                  onFrameworkChange?.(event.target.value.length > 0 ? event.target.value : null)
                }
                className="w-full rounded border border-white/10 bg-[#121216] px-2 py-1.5 text-xs text-zinc-100"
                disabled={!onFrameworkChange || frameworkLocked}
              >
                <option value="">None (generic expression)</option>
                {(frameworkOptions.length ? frameworkOptions : framework ? [framework] : []).map(
                  (item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-200">
                {statusLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onSaveDraft) {
                    void onSaveDraft(expression.trim()).catch(() => undefined);
                  }
                }}
                disabled={isSavingDraft}
                className="inline-flex items-center gap-1 rounded-md border border-white/[0.12] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-[#e4e4e7] hover:bg-white/[0.06]"
              >
                {isSavingDraft ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                {isSavingDraft ? "Saving..." : "Save draft"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSubmitForReview) {
                    void onSubmitForReview().catch(() => undefined);
                  }
                }}
                disabled={isSubmittingReview || !canSubmitForReview}
                className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-[#71717a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingReview ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                {isSubmittingReview ? "Submitting..." : "Submit for review"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid min-w-0",
          isStacked
            ? "grid-cols-1"
            : "min-h-[420px] grid-cols-1 @min-[900px]:grid-cols-[minmax(0,1fr)_280px]",
        )}
      >
        {isStacked ? (
          <>
            {toolsAside}
            {editorPanel}
          </>
        ) : (
          <>
            {editorPanel}
            {toolsAside}
          </>
        )}
      </div>

      <div
        className={cn(
          "grid gap-3 border-t border-white/[0.08] bg-[#0f0f12] p-3 text-xs",
          isStacked ? "grid-cols-1 sm:grid-cols-3" : "md:grid-cols-3",
        )}
      >
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#71717a]">Target</p>
          <p className="mt-1 text-[#e4e4e7]">{targetLabel}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#71717a]">Status</p>
          <p className="mt-1 inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
            {validateState === "validating" ? <Loader2 className="size-3.5 animate-spin" /> : <CircleCheck className="size-3.5" />}
            {governanceStatus ?? statusLabel}
          </p>
          {governanceReason ? (
            <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{governanceReason}</p>
          ) : null}
          {governanceUpdatedAt ? (
            <p className="mt-1 text-[11px] text-zinc-500">
              Updated {new Date(governanceUpdatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#71717a]">Dependencies</p>
          <p className="mt-1 text-[#e4e4e7]">{dependencies.join(", ") || "—"}</p>
        </div>
      </div>

      {diagnostics.length > 0 ? (
        <div className="space-y-2 border-t border-white/[0.08] bg-[#111114] p-3 text-xs">
          {diagnostics.map((item, index) => {
            const tone = severityTone(item.severity);
            const styles =
              tone === "error"
                ? "border-rose-500/25 bg-rose-500/10 text-rose-200/90"
                : tone === "warning"
                  ? "border-amber-500/25 bg-amber-500/10 text-amber-200/90"
                  : "border-sky-500/25 bg-sky-500/10 text-sky-200/90";

            const Icon = tone === "error" ? CircleAlert : tone === "warning" ? Beaker : Info;
            const hint = diagnosticHint(item);

            return (
              <div
                key={`${item.type}-${index}`}
                className={`flex items-start gap-2 rounded-md border p-2 ${styles}`}
              >
                <Icon className="mt-0.5 size-3.5 shrink-0" />
                <div className="min-w-0">
                  <p>{diagnosticSummary(item.message)}</p>
                  {hint ? <p className="mt-1 text-[11px] opacity-90">{hint}</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
