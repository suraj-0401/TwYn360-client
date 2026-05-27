/**
 * Relational impact lines for RESTRICTED/DESTRUCTIVE confirms (G3).
 * Counts only — no formula or dependency graph text.
 * @see services/dff-service/docs/GOVERNANCE.md
 */

import type {
  FactorSetMemberRemoveImpact,
  FactorSetUsageImpact,
  FactorUsageImpact,
  ModelDetachImpact,
} from "@/types/governance-impact";

function countLabel(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

function joinImpactLines(lines: string[]): string | undefined {
  const filtered = lines.filter(Boolean);
  if (filtered.length === 0) {
    return undefined;
  }
  return filtered.join("\n");
}

export function formatFactorArchiveImpact(
  impact?: FactorUsageImpact,
): string | undefined {
  if (!impact) {
    return undefined;
  }
  const lines: string[] = [];

  if (impact.factorSetCount > 0) {
    lines.push(
      `Included in ${countLabel(impact.factorSetCount, "factor set")}${
        impact.activeFactorSetCount < impact.factorSetCount
          ? ` (${impact.activeFactorSetCount} not archived)`
          : ""
      }.`,
    );
  }

  if (impact.modelCount > 0) {
    lines.push(
      `Materialized on ${countLabel(impact.modelCount, "model")} (${countLabel(impact.modelInstanceCount, "factor instance")}).`,
    );
  }

  return joinImpactLines(lines);
}

export function formatFactorPermanentDeleteImpact(
  impact?: FactorUsageImpact,
): string | undefined {
  const archiveLine = formatFactorArchiveImpact(impact);
  if (archiveLine) {
    return `${archiveLine}\n\nArchive when possible. Permanent removal is only for draft or archived records with no references.`;
  }
  return undefined;
}

export function formatFactorSetArchiveImpact(
  impact: FactorSetUsageImpact,
): string | undefined {
  const lines: string[] = [];

  if (impact.memberCount > 0) {
    lines.push(`Contains ${countLabel(impact.memberCount, "factor")}.`);
  }

  if (impact.linkedModelCount > 0) {
    lines.push(
      `Linked from ${countLabel(impact.linkedModelCount, "model")}.`,
    );
  }

  if (impact.activeModelCount > 0) {
    lines.push(
      `${countLabel(impact.activeModelCount, "active model")} — ${countLabel(impact.preservedInstanceCount, "factor instance", "factor instances")} will be preserved on those models (P7).`,
    );
  }

  return joinImpactLines(lines);
}

export function formatFactorSetMemberRemoveImpact(
  impact: FactorSetMemberRemoveImpact,
): string | undefined {
  if (impact.activeModelCount === 0) {
    return undefined;
  }

  const lines = [
    `This set is linked to ${countLabel(impact.activeModelCount, "active model")}.`,
  ];
  if (impact.preservedInstanceCount > 0) {
    lines.push(
      `${countLabel(impact.preservedInstanceCount, "factor instance", "factor instances")} on active models will be preserved until you change the model graph.`,
    );
  }
  return joinImpactLines(lines);
}

export function formatModelDetachImpact(
  impact: ModelDetachImpact,
): string | undefined {
  if (impact.instanceCount === 0) {
    return undefined;
  }

  if (impact.instancesRemovedOnDetach) {
    return `This will remove ${countLabel(impact.instanceCount, "factor instance", "factor instances")} from this draft model.`;
  }

  return `${countLabel(impact.instanceCount, "factor instance", "factor instances")} from this set on the model.`;
}
