import { Patient, Visit, RiskFlag } from "./types";

/**
 * Guideline anchors encoded here:
 * - Hypertension: ESC 2024 — default treated SBP target 120-129 mmHg if tolerated;
 *   relaxed target (<140/90, individualised) for frail/older or intolerant patients.
 * - Lipids (Indian diabetes/dyslipidaemia consensus): LDL-C <70 mg/dL for high-risk,
 *   <55 mg/dL for very-high-risk (established ASCVD, or diabetes + additional risk factor).
 * - Diabetes: RSSDI-aligned — HbA1c <7% general target, individualised to <8% for
 *   frail/hypoglycaemia-prone; regular SMBG (fasting + postprandial) monitoring.
 *
 * These are decision-support defaults, not a substitute for individualised clinical
 * judgement. Targets should be reviewed against the current full guideline text and
 * relaxed per patient (age, frailty, hypoglycaemia risk, life expectancy).
 */

export function ldlTarget(patient: Patient): { target: number; tier: string } {
  if (patient.ascvd_history) {
    return { target: 55, tier: "Very-high-risk (established ASCVD)" };
  }
  const extraRiskFactors = [
    patient.family_history_premature_ascvd,
    patient.smoking_status === "current",
    (patient.comorbidities || []).some((c) =>
      /ckd|chronic kidney/i.test(c)
    ),
  ].filter(Boolean).length;

  if (extraRiskFactors >= 1) {
    return { target: 55, tier: "Very-high-risk (diabetes + additional risk factor)" };
  }
  return { target: 70, tier: "High-risk (diabetes, no additional risk factor)" };
}

export function bpTarget(patient: Patient): { sbpTarget: number; note: string } {
  // ESC 2024 default; relax for age >=80 or documented intolerance/frailty tag.
  const isFrailOrOlder =
    patient.age >= 80 ||
    (patient.comorbidities || []).some((c) => /frail/i.test(c));
  if (isFrailOrOlder) {
    return { sbpTarget: 140, note: "Relaxed target (age/frailty) per ESC 2024 individualisation" };
  }
  return { sbpTarget: 129, note: "Default ESC 2024 target: 120–129 mmHg if tolerated" };
}

export function computeBMI(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function computeRiskFlags(patient: Patient, visits: Visit[]): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (visits.length === 0) {
    flags.push({
      code: "no_data",
      label: "No visits recorded",
      severity: "warn",
      detail: "Add a baseline visit to begin guideline tracking.",
    });
    return flags;
  }

  const latest = [...visits].sort(
    (a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
  )[0];

  // HbA1c
  if (latest.hba1c != null) {
    if (latest.hba1c < 7) {
      flags.push({ code: "hba1c", label: "HbA1c at target", severity: "ok", detail: `${latest.hba1c}% (<7%)` });
    } else if (latest.hba1c < 8) {
      flags.push({ code: "hba1c", label: "HbA1c above target", severity: "warn", detail: `${latest.hba1c}% — intensify per RSSDI` });
    } else {
      flags.push({ code: "hba1c", label: "HbA1c poorly controlled", severity: "alert", detail: `${latest.hba1c}% — escalate therapy` });
    }
  }

  // BP
  const { sbpTarget, note } = bpTarget(patient);
  if (latest.sbp != null) {
    if (latest.sbp <= sbpTarget) {
      flags.push({ code: "bp", label: "BP at target", severity: "ok", detail: `${latest.sbp}/${latest.dbp ?? "-"} mmHg — ${note}` });
    } else if (latest.sbp <= sbpTarget + 15) {
      flags.push({ code: "bp", label: "BP above target", severity: "warn", detail: `${latest.sbp}/${latest.dbp ?? "-"} mmHg — ${note}` });
    } else {
      flags.push({ code: "bp", label: "BP significantly elevated", severity: "alert", detail: `${latest.sbp}/${latest.dbp ?? "-"} mmHg — ${note}` });
    }
  }

  // LDL-C
  const { target: ldlT, tier } = ldlTarget(patient);
  if (latest.ldl_c != null) {
    if (latest.ldl_c <= ldlT) {
      flags.push({ code: "ldl", label: "LDL-C at target", severity: "ok", detail: `${latest.ldl_c} mg/dL — ${tier}, target <${ldlT}` });
    } else if (latest.ldl_c <= ldlT + 30) {
      flags.push({ code: "ldl", label: "LDL-C above target", severity: "warn", detail: `${latest.ldl_c} mg/dL — ${tier}, target <${ldlT}` });
    } else {
      flags.push({ code: "ldl", label: "LDL-C markedly elevated", severity: "alert", detail: `${latest.ldl_c} mg/dL — ${tier}, target <${ldlT}` });
    }
  }

  // Kidney
  if (latest.egfr != null && latest.egfr < 60) {
    flags.push({ code: "egfr", label: "Reduced eGFR", severity: latest.egfr < 30 ? "alert" : "warn", detail: `${latest.egfr} mL/min/1.73m²` });
  }
  if (latest.urine_albumin_creatinine_ratio != null && latest.urine_albumin_creatinine_ratio >= 30) {
    flags.push({ code: "uacr", label: "Albuminuria present", severity: latest.urine_albumin_creatinine_ratio >= 300 ? "alert" : "warn", detail: `UACR ${latest.urine_albumin_creatinine_ratio} mg/g` });
  }

  // Hypoglycaemia
  if (latest.hypoglycaemia_episodes && latest.hypoglycaemia_episodes > 0) {
    flags.push({ code: "hypo", label: "Recent hypoglycaemia", severity: "warn", detail: `${latest.hypoglycaemia_episodes} episode(s) since last visit — consider relaxing HbA1c target` });
  }

  // Trajectory (trend slope) — requires >=2 visits
  const sorted = [...visits].sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());
  if (sorted.length >= 2) {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (first.hba1c != null && last.hba1c != null) {
      const delta = last.hba1c - first.hba1c;
      if (delta >= 0.5) {
        flags.push({ code: "trend_hba1c", label: "Worsening HbA1c trend", severity: "alert", detail: `+${delta.toFixed(1)}% since baseline despite advice — consider escalation` });
      } else if (delta <= -0.5) {
        flags.push({ code: "trend_hba1c", label: "Improving HbA1c trend", severity: "ok", detail: `${delta.toFixed(1)}% since baseline` });
      }
    }
  }

  return flags;
}

export function targetAttainment(patient: Patient, visit: Visit) {
  const { sbpTarget } = bpTarget(patient);
  const { target: ldlT } = ldlTarget(patient);
  return {
    hba1c_at_target: visit.hba1c != null ? visit.hba1c < 7 : null,
    bp_at_target: visit.sbp != null ? visit.sbp <= sbpTarget : null,
    ldl_at_target: visit.ldl_c != null ? visit.ldl_c <= ldlT : null,
  };
}
