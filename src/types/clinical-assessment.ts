import type { RuntimeExecutionResult } from "./runtime";

export type ClinicalAssessmentStatus = "draft" | "completed";

export type ClinicalAssessment = {
  id: string;
  modelId: string;
  statusCode: ClinicalAssessmentStatus;
  subjectLabel: string | null;
  inputs: Record<string, unknown>;
  lastResult: RuntimeExecutionResult | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type ClinicalAssessmentSummary = {
  id: string;
  modelId: string;
  modelDisplayName: string;
  modelSlug: string;
  statusCode: ClinicalAssessmentStatus;
  subjectLabel: string | null;
  version: number;
  updatedAt: string;
  createdBy: string | null;
};

export type CreateClinicalAssessmentPayload = {
  subjectLabel?: string;
  inputs?: Record<string, unknown>;
};

export type UpdateClinicalAssessmentPayload = {
  subjectLabel?: string | null;
  inputs?: Record<string, unknown>;
  lastResult?: RuntimeExecutionResult | null;
  statusCode?: ClinicalAssessmentStatus;
  expectedVersion?: number;
};
