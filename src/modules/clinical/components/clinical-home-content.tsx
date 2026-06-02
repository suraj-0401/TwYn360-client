"use client";

import { ClinicalHomePanel } from "@/modules/clinical/components/clinical-home-panel";
import { ClinicalModelsList } from "@/modules/clinical/components/clinical-models-list";
import { ClinicalRecentAssessments } from "@/modules/clinical/components/clinical-recent-assessments";

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function ClinicalHomeContent() {
  return (
    <div className="mx-auto max-w-6xl pb-10">
      <header className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-medium text-emerald-500/80">Clinical</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            Good to see you
          </h1>
        </div>
        <p className="text-[12px] text-zinc-600">{todayLabel()}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <ClinicalHomePanel title="Start a new assessment" className="min-h-[280px]">
          <ClinicalModelsList />
        </ClinicalHomePanel>

        <ClinicalHomePanel
          title="Your visits"
          className="lg:sticky lg:top-5"
        >
          <ClinicalRecentAssessments />
        </ClinicalHomePanel>
      </div>
    </div>
  );
}
