import { clinicalUnitSuffix } from "@/modules/clinical/utils/clinical-unit-label";

/** Format numeric outputs for clinician-facing display. */
export function formatClinicalValue(
  value: number,
  unitCode?: string | null,
  unitDisplayLabel?: string | null,
): string {
  const abs = Math.abs(value);
  const digits =
    abs >= 100 ? 1 : abs >= 10 ? 2 : abs >= 1 ? 3 : 4;
  const formatted = value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });

  const unit = clinicalUnitSuffix(unitCode, unitDisplayLabel);
  if (!unit) {
    return formatted;
  }

  if (unit === "%") {
    return `${formatted}%`;
  }

  return `${formatted} ${unit}`;
}
