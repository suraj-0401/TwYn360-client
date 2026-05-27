/**
 * Product vocabulary for governed mutations (G2).
 * @see services/dff-service/docs/GOVERNANCE.md
 */

import type { ConfirmOptions } from "@/components/feedback";
import {
  formatFactorArchiveImpact,
  formatFactorPermanentDeleteImpact,
  formatFactorSetArchiveImpact,
  formatFactorSetMemberRemoveImpact,
  formatModelDetachImpact,
} from "@/config/impact-copy";
import type {
  FactorSetMemberRemoveImpact,
  FactorSetUsageImpact,
  FactorUsageImpact,
  ModelDetachImpact,
} from "@/types/governance-impact";

export const MUTATION_CATEGORY = {
  SAFE: "SAFE",
  RESTRICTED: "RESTRICTED",
  DESTRUCTIVE: "DESTRUCTIVE",
} as const;

export type MutationCategory =
  (typeof MUTATION_CATEGORY)[keyof typeof MUTATION_CATEGORY];

/** Primary actions (buttons, menu items). */
export const MUTATION_ACTION_LABEL = {
  archive: "Archive",
  archiveFactor: "Archive factor",
  archiveFactorSet: "Archive factor set",
  archiveCategory: "Archive category",
  archiveDrug: "Archive drug",
  archiveWorkspace: "Archive workspace",
  restore: "Restore",
  restoreToActive: "Restore to active",
  detachFactorSet: "Detach set",
  removeFromSet: "Remove from set",
  clearOverride: "Clear override",
  clearAllOverrides: "Clear all overrides",
  permanentlyRemove: "Permanently remove",
  configure: "Configure",
  saveConfiguration: "Save configuration",
} as const;

/** Success toasts after mutations complete. */
export const MUTATION_SUCCESS_MESSAGE = {
  factorArchived: "Factor archived",
  factorRestored: "Factor restored",
  factorPermanentlyRemoved: "Factor permanently removed",
  factorSetArchived: "Factor set archived",
  factorSetAttached: "Factor set attached",
  factorSetDetached: "Factor set detached",
  factorRemovedFromSet: "Factor removed from set",
  factorSetOrderUpdated: "Factor set order updated",
  workspaceArchived: "Workspace archived",
  workspaceRestored: "Workspace restored to active",
  workspacePermanentlyRemoved: "Workspace permanently removed",
  categoryArchived: "Category archived",
  categoryPermanentlyRemoved: "Category permanently removed",
  overridesCleared: "Overrides cleared",
  configurationSaved: "Configuration saved",
} as const;

/** Static copy for danger zones and help text. */
export const MUTATION_HELP_COPY = {
  preferArchive:
    "Prefer Archive when you want to hide something but keep history. Use Permanently remove only from the danger zone when nothing references this record.",
  confirmNamePrompt: (name: string) =>
    `Type ${name} to confirm permanent removal`,
  permanentlyRemovedReadOnly:
    "This record is permanently removed and cannot be changed.",
  workspacePermanentlyRemovedReadOnly:
    "This workspace is permanently removed and cannot be changed.",
  archiveBeforePermanentRemove:
    "Archive first. Permanently remove is only available for draft or archived workspaces with no runtime usage.",
  activeWorkspaceArchiveFirst:
    "Structural changes are locked on active workspaces. Archive before permanent removal.",
  factorPermanentRemoveBlocked:
    "Permanent removal is blocked while this factor is in active factor sets. Archive instead, or remove it from those sets first.",
  categoryPermanentRemoveBlocked:
    "Permanent removal is blocked while active drugs use this category. Archive instead.",
  detachFactorSetHint:
    "The global factor set is not archived or removed — only this model's link and draft instances are affected.",
  instanceOverridesHint:
    "Overrides change presentation on this model only. The factor instance row is kept for formulas and audit.",
} as const;

function destructiveConfirm(
  options: ConfirmOptions,
): ConfirmOptions {
  return { variant: "destructive", ...options };
}

function restrictedConfirm(options: ConfirmOptions): ConfirmOptions {
  return { variant: "default", ...options };
}

function withImpactDescription(
  base: string,
  impactLine?: string,
): string {
  if (!impactLine) {
    return base;
  }
  return `${base}\n\n${impactLine}`;
}

/** Confirm dialogs — titles align with mutation category. */
export const mutationConfirm = {
  archiveFactor: (
    inActiveSets: boolean,
    impact?: FactorUsageImpact,
  ): ConfirmOptions => {
    const base = inActiveSets
      ? "It may remain in existing factor sets but will be hidden from new use. You can restore it later."
      : "It will be hidden from the registry. You can restore it later. Prefer this over permanent removal.";

    return restrictedConfirm({
      title: "Archive this factor?",
      description: withImpactDescription(base, formatFactorArchiveImpact(impact)),
      confirmLabel: MUTATION_ACTION_LABEL.archive,
    });
  },

  restoreFactor: (): ConfirmOptions =>
    restrictedConfirm({
      title: "Restore this factor?",
      description: "It will return to active status.",
      confirmLabel: MUTATION_ACTION_LABEL.restore,
    }),

  permanentlyRemoveFactor: (impact?: FactorUsageImpact): ConfirmOptions =>
    destructiveConfirm({
      title: "Permanently remove this factor?",
      description: withImpactDescription(
        "Requires matching the factor name below. The row is kept for audit only. Archive when possible.",
        formatFactorPermanentDeleteImpact(impact),
      ),
      confirmLabel: MUTATION_ACTION_LABEL.permanentlyRemove,
    }),

  archiveFactorSet: (impact?: FactorSetUsageImpact): ConfirmOptions => {
    const destructive = (impact?.activeModelCount ?? 0) > 0;
    const base =
      "Membership changes will be disabled. Linked models keep their factor instances.";

    return (destructive ? destructiveConfirm : restrictedConfirm)({
      title: destructive
        ? "Archive this factor set on active models?"
        : "Archive this factor set?",
      description: withImpactDescription(
        base,
        impact ? formatFactorSetArchiveImpact(impact) : undefined,
      ),
      confirmLabel: MUTATION_ACTION_LABEL.archiveFactorSet,
    });
  },

  archiveCategory: (): ConfirmOptions =>
    restrictedConfirm({
      title: "Archive this category?",
      description:
        "It will be hidden from new drug dropdowns. Existing drugs keep their category link.",
      confirmLabel: MUTATION_ACTION_LABEL.archiveCategory,
    }),

  permanentlyRemoveCategory: (): ConfirmOptions =>
    destructiveConfirm({
      title: "Permanently remove this category?",
      description:
        "Requires matching the category name below. Active drugs must be reassigned first.",
      confirmLabel: MUTATION_ACTION_LABEL.permanentlyRemove,
    }),

  archiveWorkspace: (): ConfirmOptions =>
    restrictedConfirm({
      title: "Archive this workspace?",
      description:
        "The model will be hidden from new scientific use. Factor set links become read-only. You can restore later.",
      confirmLabel: MUTATION_ACTION_LABEL.archiveWorkspace,
    }),

  restoreWorkspace: (): ConfirmOptions =>
    restrictedConfirm({
      title: "Restore workspace to active?",
      description: "The workspace returns to operational status.",
      confirmLabel: MUTATION_ACTION_LABEL.restoreToActive,
    }),

  permanentlyRemoveWorkspace: (displayName: string): ConfirmOptions =>
    destructiveConfirm({
      title: `Permanently remove “${displayName}”?`,
      description:
        "Requires matching the workspace name below. This marks the model as removed and cannot be undone.",
      confirmLabel: MUTATION_ACTION_LABEL.permanentlyRemove,
    }),

  detachFactorSetFromModel: (impact?: ModelDetachImpact): ConfirmOptions =>
    destructiveConfirm({
      title: "Detach this factor set?",
      description: withImpactDescription(
        `On draft models, factor instances from this set are removed. ${MUTATION_HELP_COPY.detachFactorSetHint}`,
        impact ? formatModelDetachImpact(impact) : undefined,
      ),
      confirmLabel: MUTATION_ACTION_LABEL.detachFactorSet,
    }),

  removeFactorFromSet: (
    factorDisplayName?: string,
    impact?: FactorSetMemberRemoveImpact,
  ): ConfirmOptions =>
    restrictedConfirm({
      title: factorDisplayName
        ? `Remove “${factorDisplayName}” from this set?`
        : "Remove factor from this set?",
      description: withImpactDescription(
        "The global factor is not archived. Models that already materialized instances may keep them until you change the model graph.",
        impact ? formatFactorSetMemberRemoveImpact(impact) : undefined,
      ),
      confirmLabel: MUTATION_ACTION_LABEL.removeFromSet,
    }),

  removeWorkspaceField: (): ConfirmOptions =>
    restrictedConfirm({
      title: "Remove this field from the layout?",
      description:
        "Stored values are kept in the database. The field will no longer appear on published forms.",
      confirmLabel: "Remove field",
    }),

  removeWorkspaceSection: (): ConfirmOptions =>
    restrictedConfirm({
      title: "Delete this section?",
      description:
        "All custom fields inside this section will be removed from the layout. Stored values are kept in the database.",
      confirmLabel: "Delete section",
    }),

  clearAllInstanceOverrides: (factorDisplayName: string): ConfirmOptions =>
    restrictedConfirm({
      title: `Clear all overrides for “${factorDisplayName}”?`,
      description:
        "Resolved values will match the registry again. The factor instance row is not removed.",
      confirmLabel: MUTATION_ACTION_LABEL.clearAllOverrides,
    }),
} as const;
