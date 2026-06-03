import type { FormulaDto } from "@/types/formula";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isFormulaDto(payload: unknown): payload is FormulaDto {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const record = payload as Partial<FormulaDto>;
  return typeof record.id === "string" && UUID_RE.test(record.id);
}

/** Unwrap ApiSuccessResponse envelopes (including accidental double-wrap) to a FormulaDto. */
export function resolveFormulaPayload(payload: unknown): FormulaDto | null {
  if (payload === null || payload === undefined) {
    return null;
  }
  if (typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (record.success === true && "data" in record) {
    return resolveFormulaPayload(record.data);
  }

  if (isFormulaDto(payload)) {
    return payload;
  }

  if ("data" in record) {
    return resolveFormulaPayload(record.data);
  }

  return null;
}
