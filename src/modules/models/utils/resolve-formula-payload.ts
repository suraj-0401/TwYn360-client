import type { FormulaDto } from "@/types/formula";

export function resolveFormulaPayload(payload: unknown): FormulaDto | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const direct = payload as FormulaDto;
  if (typeof direct.id === "string" && typeof direct.status === "string") {
    return direct;
  }

  const wrapped = payload as { data?: FormulaDto };
  if (
    wrapped.data &&
    typeof wrapped.data.id === "string" &&
    typeof wrapped.data.status === "string"
  ) {
    return wrapped.data;
  }

  return null;
}
