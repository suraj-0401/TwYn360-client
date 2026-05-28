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
import type { Monaco } from "@monaco-editor/react";
import type { editor, IDisposable } from "monaco-editor";
import {
  type SimulationKnownVariable,
  parseFormulaPreview,
  type SimulationValidationError,
} from "@/services/simulation-formula.service";

type FormulaPlaygroundSkeletonProps = {
  targetLabel: string;
  targetAlias: string;
  framework: string;
  frameworkOptions?: string[];
  onFrameworkChange?: (framework: string) => void;
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
type WorkflowDefinition = {
  id: string;
  label: string;
  description: string;
  fields: Array<{ key: string; label: string; placeholder: string }>;
  build: (targetAlias: string, values: Record<string, string>) => string;
};
type MathfieldElement = HTMLElement & {
  value: string;
  getValue?: (format?: string) => string;
};

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const FORMULA_LANGUAGE_ID = "formulaDsl";
const MARKER_OWNER = "formula-playground";

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
}: FormulaPlaygroundSkeletonProps) {
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
  const [previewLatex, setPreviewLatex] = useState("");
  const [previewExpression, setPreviewExpression] = useState("");
  const [inlineRenderedToken, setInlineRenderedToken] = useState("");
  const [inputMode, setInputMode] = useState<FormulaInputMode>("monaco");
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>("emax");
  const [workflowValues, setWorkflowValues] = useState<Record<string, string>>({
    exposureAlias: "weight",
    emaxAlias: "emax",
    ec50Alias: "ec50",
    hillAlias: "hill",
    midpointAlias: "50",
    slopeAlias: "1",
    lowerAlias: "0",
    upperAlias: "1",
    markerAlias: "weight",
    thresholdAlias: "70",
    belowAlias: "0",
    aboveAlias: "1",
  });
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const completionRef = useRef<IDisposable | null>(null);
  const hoverProviderRef = useRef<IDisposable | null>(null);
  const cursorListenerRef = useRef<IDisposable | null>(null);
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
  const templateOptions = templatesByFramework[framework] ?? templatesByFramework.additive;
  const operatorTokens = ["+", "-", "*", "/", "^", "(", ")", "sqrt()", "log()", "exp()", "abs()"];
  const advancedWorkflows = useMemo<WorkflowDefinition[]>(
    () => [
      {
        id: "emax",
        label: "Emax model",
        description: "Saturating exposure-response with EC50 control.",
        fields: [
          { key: "exposureAlias", label: "Exposure alias", placeholder: "weight" },
          { key: "emaxAlias", label: "Emax alias/value", placeholder: "emax" },
          { key: "ec50Alias", label: "EC50 alias/value", placeholder: "ec50" },
        ],
        build: (target, values) =>
          `${target} = (${values.emaxAlias || "emax"} * ${values.exposureAlias || "weight"}) / (${values.ec50Alias || "ec50"} + ${values.exposureAlias || "weight"})`,
      },
      {
        id: "hill",
        label: "Hill response",
        description: "Sigmoid response with explicit Hill coefficient.",
        fields: [
          { key: "exposureAlias", label: "Exposure alias", placeholder: "weight" },
          { key: "emaxAlias", label: "Emax alias/value", placeholder: "emax" },
          { key: "ec50Alias", label: "EC50 alias/value", placeholder: "ec50" },
          { key: "hillAlias", label: "Hill alias/value", placeholder: "hill" },
        ],
        build: (target, values) => {
          const exposure = values.exposureAlias || "weight";
          const hill = values.hillAlias || "hill";
          return `${target} = (${values.emaxAlias || "emax"} * (${exposure} ^ ${hill})) / ((${values.ec50Alias || "ec50"} ^ ${hill}) + (${exposure} ^ ${hill}))`;
        },
      },
      {
        id: "logistic",
        label: "Logistic risk",
        description: "Risk score mapped to 0-1 logistic space.",
        fields: [
          { key: "midpointAlias", label: "Midpoint", placeholder: "50" },
          { key: "slopeAlias", label: "Slope", placeholder: "1" },
          { key: "exposureAlias", label: "Signal alias", placeholder: "weight" },
        ],
        build: (target, values) =>
          `${target} = 1 / (1 + exp(-(${values.slopeAlias || "1"} * ((${values.exposureAlias || "weight"}) - (${values.midpointAlias || "50"})))))`,
      },
      {
        id: "threshold",
        label: "Piecewise threshold",
        description: "Binary switch above a threshold using Heaviside approximation.",
        fields: [
          { key: "markerAlias", label: "Marker alias", placeholder: "weight" },
          { key: "thresholdAlias", label: "Threshold", placeholder: "70" },
          { key: "belowAlias", label: "Below value", placeholder: "0" },
          { key: "aboveAlias", label: "Above value", placeholder: "1" },
        ],
        build: (target, values) =>
          `${target} = (${values.belowAlias || "0"}) + ((${values.aboveAlias || "1"}) - (${values.belowAlias || "0"})) * (1 / (1 + exp(-100 * ((${values.markerAlias || "weight"}) - (${values.thresholdAlias || "70"})))))`,
      },
    ],
    [],
  );
  const activeWorkflow = advancedWorkflows.find((item) => item.id === activeWorkflowId) ?? advancedWorkflows[0];

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

  function applyWorkflow() {
    if (!activeWorkflow) return;
    const workflowExpression = activeWorkflow.build(targetAlias, workflowValues);
    applyEditorValue(workflowExpression);
  }

  const tabs = [
    { key: "variables" as const, label: "Variables", icon: Link2 },
    { key: "templates" as const, label: "Templates", icon: Sparkles },
    { key: "deps" as const, label: "Deps", icon: FileCheck2 },
  ];

  useEffect(() => {
    try {
      const candidate = expression.split("=").slice(1).join("=").trim() || expression.trim();
      setPreviewExpression(candidate);
      if (!candidate) {
        setRenderedMath("");
        setPreviewLatex("");
        return;
      }
      const html = katex.renderToString(candidate, {
        throwOnError: false,
        displayMode: false,
        strict: "ignore",
      });
      setRenderedMath(html);
      if (inputMode === "mathlive" && mathfieldRef.current?.getValue) {
        setPreviewLatex(mathfieldRef.current.getValue("latex"));
      } else {
        setPreviewLatex(candidate);
      }
    } catch {
      setRenderedMath("");
      setPreviewLatex("");
    }
  }, [expression, inputMode]);

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
                    label: `${framework}-template`,
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
    cursorListenerRef.current?.dispose();

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

    if (!editorInstance) return;

    cursorListenerRef.current = editorInstance.onDidChangeCursorPosition((event) => {
      const word = model.getWordAtPosition(event.position);
      if (!word?.word) {
        setInlineRenderedToken("");
        return;
      }
      setInlineRenderedToken(word.word);
    });

    return () => {
      hoverProviderRef.current?.dispose();
      hoverProviderRef.current = null;
      cursorListenerRef.current?.dispose();
      cursorListenerRef.current = null;
    };
  }, [monacoReady]);

  useEffect(() => {
    const current = expression.trim();
    if (!current) {
      return;
    }

    const timer = setTimeout(async () => {
      setValidateState("validating");
      try {
        const knownVariables: SimulationKnownVariable[] = variables.map((item) => ({
          alias: item.alias,
          instanceId: item.instanceId,
        }));
        const result = await parseFormulaPreview({
          framework,
          frameworkVersion,
          expression: current,
          knownVariables,
        });

        setFrameworkVersion(result.frameworkVersion ?? frameworkVersion);
        const nextDiagnostics = result.errors ?? [];
        setDiagnostics(nextDiagnostics);
        setDependencies((result.dependencies ?? []).map((dep) => dep.alias));

        const hasError = nextDiagnostics.some(
          (item) => severityTone(item.severity) === "error",
        );
        const nextState: ValidateState = hasError ? "broken" : "valid";
        setValidateState(nextState);
        onParseUpdate?.({
          status: nextState,
          dependencies: (result.dependencies ?? []).map((dep) => dep.alias),
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
  }, [expression, framework, frameworkVersion, onParseUpdate, variables]);

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

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#121214]">
      <div className="border-b border-white/[0.08] px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[#f4f4f5]">
              {targetLabel} - Formula Editor
            </p>
            <p className="mt-1 text-xs text-[#a1a1aa]">
              {framework} framework - draft v{governanceVersion ?? 1}
            </p>
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-400">
              Framework
            </label>
            <select
              value={framework}
              onChange={(event) => onFrameworkChange?.(event.target.value)}
              className="w-full rounded border border-white/10 bg-[#121216] px-2 py-1 text-xs text-zinc-100"
              disabled={!onFrameworkChange || frameworkLocked}
            >
              {(frameworkOptions.length ? frameworkOptions : [framework]).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
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
              {isSavingDraft ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
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
              {isSubmittingReview ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              {isSubmittingReview ? "Submitting..." : "Submit for review"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid border-b border-white/[0.08] text-xs lg:grid-cols-4">
        {[
          ["1", "Formula type", framework],
          ["2", "Write expression", "In progress"],
          ["3", "Validation", validateState === "validating" ? "Running" : "Ready"],
          ["4", "Review & submit", validateState === "broken" ? "Locked" : "Ready"],
        ].map(([index, label, sub]) => (
          <div
            key={label}
            className="flex items-center gap-2 border-r border-white/[0.06] px-3 py-2 last:border-r-0"
          >
            <span className="inline-flex size-5 items-center justify-center rounded-full border border-white/[0.16] text-[11px] text-[#d4d4d8]">
              {index}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[#e4e4e7]">{label}</p>
              <p className="truncate text-[11px] text-[#71717a]">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid min-h-[420px] lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="border-r border-white/[0.08] p-3">
          <div className="flex items-center justify-between pb-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#71717a]">
              Expression
            </p>
            <span className="text-[11px] text-[#71717a]">{framework}</span>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputMode("monaco")}
              className={`rounded border px-2 py-1 text-[11px] ${inputMode === "monaco" ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-200" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}
            >
              Monaco
            </button>
            <button
              type="button"
              onClick={() => setInputMode("mathlive")}
              className={`rounded border px-2 py-1 text-[11px] ${inputMode === "mathlive" ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-200" : "border-white/10 bg-white/[0.03] text-zinc-300"}`}
            >
              MathLive
            </button>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {operatorTokens.map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => insertToken(token)}
                className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-zinc-300 hover:bg-white/[0.08]"
              >
                {token}
              </button>
            ))}
          </div>
          {inputMode === "monaco" ? (
            <div className="h-[355px] overflow-hidden rounded-md border border-white/[0.08] bg-[#0b0b0d]">
              <MonacoEditor
                height="355px"
                language={FORMULA_LANGUAGE_ID}
                theme="vs-dark"
                value={expression}
                beforeMount={(monaco) => {
                  monaco.languages.register({ id: FORMULA_LANGUAGE_ID });
                  monaco.languages.setMonarchTokensProvider(FORMULA_LANGUAGE_ID, {
                    tokenizer: {
                      root: [
                        [/[a-zA-Z_][\\w]*/, "identifier"],
                        [/\\d+(\\.\\d+)?/, "number"],
                        [/[+*/^=-]/, "operator"],
                        [/[()]/, "delimiter.parenthesis"],
                      ],
                    },
                  });
                }}
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
            <div className="h-[355px] overflow-auto rounded-md border border-white/[0.08] bg-[#0b0b0d] p-3">
              <math-field
                ref={(node) => {
                  mathfieldRef.current = node as MathfieldElement | null;
                }}
                className="block min-h-[320px] w-full rounded border border-white/10 bg-[#0f0f12] p-3 text-base text-zinc-100"
              />
            </div>
          )}
          <div className="mt-3 rounded-md border border-white/10 bg-[#0f0f12] p-2">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-400">
              Shared preview ({inputMode === "monaco" ? "Monaco" : "MathLive"})
            </p>
            {renderedMath ? (
              <div
                className="overflow-x-auto text-zinc-100"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: renderedMath }}
              />
            ) : (
              <p className="text-xs text-zinc-400">Preview unavailable for current expression.</p>
            )}
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div className="rounded border border-white/10 bg-[#111114] p-2">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Expression</p>
                <p className="mt-1 break-all font-mono text-[11px] text-zinc-300">
                  {previewExpression || "-"}
                </p>
              </div>
              <div className="rounded border border-white/10 bg-[#111114] p-2">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">LaTeX</p>
                <p className="mt-1 break-all font-mono text-[11px] text-zinc-300">
                  {previewLatex || "-"}
                </p>
              </div>
            </div>
            {inputMode === "monaco" ? (
              <div className="mt-2 rounded border border-white/10 bg-[#111114] p-2">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  Inline symbolic token preview
                </p>
                {inlineRenderedToken ? (
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] text-zinc-300">{inlineRenderedToken}</p>
                    <span
                      className="text-zinc-100"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{
                        __html: katex.renderToString(inlineRenderedToken, {
                          throwOnError: false,
                          strict: "ignore",
                        }),
                      }}
                    />
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Move cursor over a token in Monaco to preview symbol rendering.
                  </p>
                )}
              </div>
            ) : null}
          </div>
          <div className="mt-3 rounded-md border border-white/10 bg-[#0f0f12] p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                Advanced scientific workflows
              </p>
              <button
                type="button"
                onClick={applyWorkflow}
                className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-200 hover:bg-cyan-500/20"
              >
                Apply workflow
              </button>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Guided builders for scientific equation patterns.
            </p>
            <div className="mt-2">
              <select
                value={activeWorkflowId}
                onChange={(event) => setActiveWorkflowId(event.target.value)}
                className="w-full rounded border border-white/10 bg-[#121216] px-2 py-1 text-xs text-zinc-100"
              >
                {advancedWorkflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.label}
                  </option>
                ))}
              </select>
            </div>
            {activeWorkflow ? (
              <div className="mt-2 space-y-2">
                <p className="text-[11px] text-zinc-400">{activeWorkflow.description}</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {activeWorkflow.fields.map((field) => (
                    <label key={field.key} className="space-y-1">
                      <span className="block text-[10px] uppercase tracking-wide text-zinc-500">
                        {field.label}
                      </span>
                      <input
                        value={workflowValues[field.key] ?? ""}
                        onChange={(event) =>
                          setWorkflowValues((previous) => ({
                            ...previous,
                            [field.key]: event.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        className="w-full rounded border border-white/10 bg-[#121216] px-2 py-1.5 text-xs text-zinc-100 outline-none ring-cyan-400/50 focus:ring-1"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col">
          <div className="flex items-center border-b border-white/[0.08]">
            {tabs.map(({ key, label, icon: Icon }) => {
              const active = key === activeTab;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={[
                    "inline-flex items-center gap-1.5 border-b px-3 py-2 text-xs",
                    active
                      ? "border-[#f4f4f5] text-[#f4f4f5]"
                      : "border-transparent text-[#71717a] hover:text-[#d4d4d8]",
                  ].join(" ")}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 space-y-2 p-3">
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
                    <span className="text-[10px] text-[#71717a]">Insert</span>
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
        </aside>
      </div>

      <div className="grid gap-3 border-t border-white/[0.08] bg-[#0f0f12] p-3 text-xs md:grid-cols-4">
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
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#71717a]">Dependencies</p>
          <p className="mt-1 text-[#e4e4e7]">{dependencies.join(", ") || "-"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#71717a]">
            Normalized Expression
          </p>
          <p className="mt-1 truncate text-[#e4e4e7]">{expression}</p>
          {governanceUpdatedAt ? (
            <p className="mt-1 text-[11px] text-zinc-400">
              Updated {new Date(governanceUpdatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 border-t border-white/[0.08] bg-[#111114] p-3 text-xs md:grid-cols-3">
        {diagnostics.length === 0 ? (
          <div className="md:col-span-3 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-200/90">
            No validation issues.
          </div>
        ) : (
          diagnostics.map((item, index) => {
            const tone = severityTone(item.severity);
            const styles =
              tone === "error"
                ? "border-rose-500/25 bg-rose-500/10 text-rose-200/90"
                : tone === "warning"
                  ? "border-amber-500/25 bg-amber-500/10 text-amber-200/90"
                  : "border-sky-500/25 bg-sky-500/10 text-sky-200/90";

            const Icon = tone === "error" ? CircleAlert : tone === "warning" ? Beaker : Info;

            return (
              <div key={`${item.type}-${index}`} className={`flex items-start gap-2 rounded-md border p-2 ${styles}`}>
                <Icon className="mt-0.5 size-3.5 shrink-0" />
                <div>
                  <p>{item.message}</p>
                  {item.suggestions?.length ? (
                    <p className="mt-1 text-[11px] opacity-90">Hint: {item.suggestions[0]}</p>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
