"use client";

import { AlertTriangle } from "lucide-react";
import { formatLifecycleStatus } from "@/config/lifecycle";
import type { ModelDto } from "@/types/model";
import { ModelDangerZone } from "./model-danger-zone";

type ModelSettingsTabProps = {
  model: ModelDto;
};

export function ModelSettingsTab({ model }: ModelSettingsTabProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <h2 className="text-sm font-medium text-[#f4f4f5]">Workspace settings</h2>
        <dl className="mt-4 divide-y divide-white/[0.06] rounded-lg border border-white/[0.06] bg-[#0c0c0e]">
          <SettingsRow label="Display name" value={model.displayName} />
          <SettingsRow label="Internal name" value={model.name} mono />
          <SettingsRow label="Slug" value={model.slug} mono />
          <SettingsRow
            label="Status"
            value={formatLifecycleStatus(model.statusCode)}
          />
          <SettingsRow
            label="Version"
            value={String(model.version)}
          />
          <SettingsRow
            label="Factor sets"
            value={String(model.factorSetCount)}
          />
        </dl>
        <p className="mt-3 text-xs text-[#52525b]">
          Core fields (drug, status, framework) are code-defined. Custom
          scientific sections will come from the form builder in a future
          release.
        </p>
      </section>

      <section className="rounded-lg border border-red-500/20 bg-red-500/[0.03]">
        <div className="border-b border-red-500/15 px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-400/90" />
            <h2 className="text-sm font-medium text-red-300/95">Danger zone</h2>
          </div>
          <p className="mt-1 text-xs text-[#71717a]">
            Lifecycle actions for this scientific workspace.
          </p>
        </div>
        <div className="px-5 py-4">
          <ModelDangerZone model={model} />
        </div>
      </section>
    </div>
  );
}

function SettingsRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-xs text-[#71717a]">{label}</dt>
      <dd
        className={
          mono
            ? "font-mono text-xs text-[#a1a1aa]"
            : "text-sm text-[#f4f4f5]"
        }
      >
        {value}
      </dd>
    </div>
  );
}
