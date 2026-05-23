/**
 * Global lifecycle states — must match services/dff-service/src/config/lifecycle.ts
 */
export const LIFECYCLE_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export type LifecycleStatus =
  (typeof LIFECYCLE_STATUS)[keyof typeof LIFECYCLE_STATUS];

export const LIFECYCLE_STATUSES: readonly LifecycleStatus[] = [
  LIFECYCLE_STATUS.DRAFT,
  LIFECYCLE_STATUS.ACTIVE,
  LIFECYCLE_STATUS.ARCHIVED,
  LIFECYCLE_STATUS.DELETED,
];

export const LIFECYCLE_STATUS_LOOKUP = "FACTOR_STATUS";
export const RECORD_STATUS_LOOKUP = "RECORD_STATUS";

export function isLifecycleStatus(value: string): value is LifecycleStatus {
  return (LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

export function formatLifecycleStatus(code: string): string {
  switch (code) {
    case LIFECYCLE_STATUS.DRAFT:
      return "Draft";
    case LIFECYCLE_STATUS.ACTIVE:
      return "Active";
    case LIFECYCLE_STATUS.ARCHIVED:
      return "Archived";
    case LIFECYCLE_STATUS.DELETED:
      return "Deleted";
    default:
      return code || "—";
  }
}

export function isArchivedLifecycle(status: string): boolean {
  return status === LIFECYCLE_STATUS.ARCHIVED;
}

export function isDeletedLifecycle(status: string): boolean {
  return status === LIFECYCLE_STATUS.DELETED;
}
