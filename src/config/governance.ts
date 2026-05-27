/**
 * Client mirrors of server governance `can*` checks (G4/G5).
 * @see services/dff-service/src/platform/governance/
 */

import { LIFECYCLE_STATUS } from "@/config/lifecycle";

/** Permanent delete: draft or archived only, plus confirmName + zero refs (G5). */
export function canPermanentDeleteByLifecycle(statusCode: string): boolean {
  return (
    statusCode === LIFECYCLE_STATUS.DRAFT ||
    statusCode === LIFECYCLE_STATUS.ARCHIVED ||
    statusCode === LIFECYCLE_STATUS.DELETED
  );
}
