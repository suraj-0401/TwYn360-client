/**
 * Example values for the semaglutide obesity-management seed model.
 * Units match registry FACTOR_UNIT codes on factors (height is metres, not cm).
 */
export const SEMAGLUTIDE_OBESITY_TEST_VALUES: Record<string, unknown> = {
  sg_body_weight: 95,
  sg_standing_height: 1.72,
  sg_baseline_body_weight: 102,
  sg_patient_age: 45,
  sg_biological_sex: "female",
  sg_fasting_plasma_glucose: 105,
  sg_glycated_hemoglobin: 6.4,
  sg_semaglutide_weekly_dose: 2.4,
  sg_treatment_duration: 16,
};

export const SEMAGLUTIDE_OBESITY_TEST_VALUE_ROWS: Array<{
  label: string;
  unit: string;
  example: string;
  alias: string;
}> = [
  { label: "Body Weight", unit: "kg", example: "95", alias: "sg_body_weight" },
  {
    label: "Standing Height",
    unit: "m (metres)",
    example: "1.72",
    alias: "sg_standing_height",
  },
  {
    label: "Baseline Body Weight",
    unit: "kg",
    example: "102",
    alias: "sg_baseline_body_weight",
  },
  { label: "Patient Age", unit: "years", example: "45", alias: "sg_patient_age" },
  {
    label: "Biological Sex",
    unit: "—",
    example: "female",
    alias: "sg_biological_sex",
  },
  {
    label: "Fasting Plasma Glucose",
    unit: "mg/dL",
    example: "105",
    alias: "sg_fasting_plasma_glucose",
  },
  {
    label: "HbA1c",
    unit: "%",
    example: "6.4",
    alias: "sg_glycated_hemoglobin",
  },
  {
    label: "Semaglutide Weekly Dose",
    unit: "mg",
    example: "2.4",
    alias: "sg_semaglutide_weekly_dose",
  },
  {
    label: "Treatment Duration",
    unit: "weeks",
    example: "16",
    alias: "sg_treatment_duration",
  },
];
