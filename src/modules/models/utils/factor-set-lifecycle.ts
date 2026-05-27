import {
  LIFECYCLE_STATUS,
  formatLifecycleStatus,
} from "@/config/lifecycle";
import type { FactorSetSummary } from "@/types/model";

export function isFactorSetUnavailable(statusCode: string): boolean {
  return (
    statusCode === LIFECYCLE_STATUS.ARCHIVED ||
    statusCode === LIFECYCLE_STATUS.DELETED
  );
}

export function formatFactorSetLinkDescription(
  set: FactorSetSummary,
  graphLocked: boolean,
): string {
  const onModel = set.modelInstanceCount ?? 0;
  const inRegistry = set.memberCount;
  const unavailable = isFactorSetUnavailable(set.statusCode);
  const statusLabel = formatLifecycleStatus(set.statusCode).toLowerCase();

  if (graphLocked) {
    if (unavailable) {
      return `${onModel} factor${onModel === 1 ? "" : "s"} preserved on this model · global set ${statusLabel}`;
    }
    return `${onModel} factor${onModel === 1 ? "" : "s"} on this model · ${inRegistry} in global registry`;
  }

  if (unavailable) {
    return `Global set ${statusLabel} · ${onModel} on model, ${inRegistry} in registry — detach this link or restore the set`;
  }

  const parts = [
    `${inRegistry} factor${inRegistry === 1 ? "" : "s"} in registry`,
    `${onModel} on this model`,
  ];
  if (set.description) {
    parts.push(set.description);
  }
  return parts.join(" · ");
}

export function activeModelPreservedFactorSetBanner(): string {
  return "This model is active — factor set links are frozen. If a global factor set is archived or deleted, its factors stay on this model so formulas, outputs, and audit history keep stable instance IDs.";
}

export function draftModelUnavailableFactorSetBanner(): string {
  return "One or more linked factor sets are archived or deleted in the global registry. On draft models, detach those links and re-sync, or restore the global set.";
}

export function preservedFactorsTabBanner(count: number): string {
  return `${count} factor instance${count === 1 ? "" : "s"} preserved from archived or deleted global factor sets. This is intentional on active models — runtime and audit reference these instance IDs, not the live registry membership.`;
}
