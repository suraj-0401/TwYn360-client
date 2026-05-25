import type { LifecycleStatus } from "@/config/lifecycle";

export type ModelFieldConfig = {
  lookups: {
    statusCode: string;
    frameworkType: string;
  };
  creatableStatusCodes: readonly string[];
  statusTransitions: Record<LifecycleStatus, readonly LifecycleStatus[]>;
  formStatusTransitions: Record<LifecycleStatus, readonly LifecycleStatus[]>;
};
