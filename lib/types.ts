// Core data model types, mirroring supabase/schema.sql

export type Sex = "male" | "female" | "other";

export interface Patient {
  id: string;
  patient_code: string; // de-identified research code, e.g. "P-0001"
  name: string; // clinic-facing only, never exported to research dataset
  age: number;
  sex: Sex;
  height_cm: number | null;
  weight_kg: number | null;
  diabetes_duration_years: number | null;
  hypertension_duration_years: number | null;

  // History
  family_history_diabetes: boolean;
  family_history_htn: boolean;
  family_history_premature_ascvd: boolean;
  smoking_status: "never" | "former" | "current";
  alcohol_use: "none" | "occasional" | "regular";
  comorbidities: string[]; // free-text tags e.g. ["CKD stage 2", "PCOS"]
  medications: string[];

  ascvd_history: boolean; // prior MI/stroke/PAD -> very-high-risk lipid tier
  created_at: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  visit_date: string; // ISO date
  test_date: string | null;
  clinician_notes: string | null;
  follow_up_interval_weeks: number | null;

  // Anthropometrics at this visit
  weight_kg: number | null;
  bmi: number | null;

  // Diabetes
  fasting_glucose: number | null; // mg/dL
  postprandial_glucose: number | null; // mg/dL
  hba1c: number | null; // %
  hypoglycaemia_episodes: number | null;

  // Hypertension
  sbp: number | null;
  dbp: number | null;
  home_sbp: number | null;
  home_dbp: number | null;

  // Lipids
  ldl_c: number | null;
  hdl_c: number | null;
  triglycerides: number | null;
  non_hdl_c: number | null; // can be derived (total - HDL) but stored for flexibility

  // Kidney / complications
  creatinine: number | null;
  egfr: number | null;
  urine_albumin_creatinine_ratio: number | null; // UACR mg/g
  neuropathy: boolean;
  retinopathy: boolean;

  // Advice delivered
  advice_diet: boolean;
  advice_exercise: boolean;
  advice_med_class_suggested: string | null; // e.g. "SGLT2i", "ACEi/ARB", "Statin intensification"
  follow_up_urgency: "routine" | "early" | "urgent";

  created_at: string;
}

export interface RiskFlag {
  code: string;
  label: string;
  severity: "ok" | "warn" | "alert";
  detail: string;
}
