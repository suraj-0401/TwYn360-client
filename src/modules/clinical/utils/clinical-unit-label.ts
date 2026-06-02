const UNIT_BY_CODE: Record<string, string> = {
  percent: "%",
  kg_m2: "kg/m²",
  mg_dl: "mg/dL",
  kg: "kg",
  m: "m",
  mg: "mg",
  weeks: "wk",
  years: "yr",
};

/** Short unit for field suffixes (avoid long registry labels in the UI). */
export function clinicalUnitSuffix(
  unitCode: string | null | undefined,
  unitDisplayLabel: string | null | undefined,
): string | null {
  const code = unitCode?.trim().toLowerCase();
  if (code && UNIT_BY_CODE[code]) {
    return UNIT_BY_CODE[code];
  }

  if (code) {
    return code.replace(/_/g, "/");
  }

  const label = unitDisplayLabel?.trim();
  if (!label) {
    return null;
  }

  const paren = label.match(/\(([^)]+)\)/);
  if (paren?.[1] && paren[1].length <= 8) {
    return paren[1].trim();
  }

  return null;
}
