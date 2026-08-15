import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Patient, Visit } from "@/lib/types";
import { targetAttainment } from "@/lib/guidelines";
import ExportButton from "./ExportButton";
import GoogleSheetsSyncButton from "./GoogleSheetsSyncButton";
import ConfigNotice from "@/components/ConfigNotice";

export const dynamic = "force-dynamic";

async function getData() {
  if (!isSupabaseConfigured) return { patients: [] as Patient[], visits: [] as Visit[] };
  const { data: patients, error: patientsError } = await supabase.from("patients").select("*");
  const { data: visits, error: visitsError } = await supabase.from("visits").select("*").order("visit_date", { ascending: true });
  if (patientsError || visitsError) {
    console.error("Failed to load research data from Supabase.", { patientsError, visitsError });
  }
  return { patients: (patients as Patient[]) || [], visits: (visits as Visit[]) || [] };
}

export default async function ResearchPage() {
  if (!isSupabaseConfigured) return <ConfigNotice />;
  const { patients, visits } = await getData();
  const byPatient = (id: string) => visits.filter((v) => v.patient_id === id);

  let atTargetHba1c = 0, atTargetBp = 0, atTargetLdl = 0, evaluable = 0;
  let familyHxWithComplication = 0, familyHxTotal = 0, noFamilyHxWithComplication = 0, noFamilyHxTotal = 0;
  let worseningDespiteAdvice = 0, twoPlusVisitPatients = 0;

  patients.forEach((p) => {
    const pv = byPatient(p.id);
    const latest = pv[pv.length - 1];
    if (latest) {
      const t = targetAttainment(p, latest);
      evaluable++;
      if (t.hba1c_at_target) atTargetHba1c++;
      if (t.bp_at_target) atTargetBp++;
      if (t.ldl_at_target) atTargetLdl++;
    }

    const hasComplication = pv.some((v) => v.neuropathy || v.retinopathy || (v.egfr != null && v.egfr < 60));
    if (p.family_history_diabetes) {
      familyHxTotal++;
      if (hasComplication) familyHxWithComplication++;
    } else {
      noFamilyHxTotal++;
      if (hasComplication) noFamilyHxWithComplication++;
    }

    if (pv.length >= 2) {
      twoPlusVisitPatients++;
      const first = pv[0], last = pv[pv.length - 1];
      const adviceGiven = pv.some((v) => v.advice_diet || v.advice_exercise || v.advice_med_class_suggested);
      if (first.hba1c != null && last.hba1c != null && last.hba1c - first.hba1c >= 0.5 && adviceGiven) {
        worseningDespiteAdvice++;
      }
    }
  });

  const rows = buildDeidentifiedRows(patients, visits);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-teal-700 mb-1">Research Hub</h1>
      <p className="text-sm text-gray-500 mb-6">
        Observational analytics on routinely captured data. All exports are de-identified (patient name excluded; patient_code only).
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h2 className="section-title mt-0">Target attainment at latest follow-up</h2>
          <ul className="text-sm space-y-1">
            <li>HbA1c &lt;7%: <b>{pct(atTargetHba1c, evaluable)}</b> ({atTargetHba1c}/{evaluable})</li>
            <li>BP at guideline target: <b>{pct(atTargetBp, evaluable)}</b> ({atTargetBp}/{evaluable})</li>
            <li>LDL-C at risk-tiered target: <b>{pct(atTargetLdl, evaluable)}</b> ({atTargetLdl}/{evaluable})</li>
          </ul>
          <p className="text-xs text-gray-400 mt-2">Addresses: &ldquo;What proportion of users meet diabetes, BP, and lipid targets at follow-up?&rdquo;</p>
        </div>

        <div className="card">
          <h2 className="section-title mt-0">Family history vs. complications</h2>
          <ul className="text-sm space-y-1">
            <li>With family history of diabetes: <b>{pct(familyHxWithComplication, familyHxTotal)}</b> have ≥1 complication marker ({familyHxWithComplication}/{familyHxTotal})</li>
            <li>Without family history: <b>{pct(noFamilyHxWithComplication, noFamilyHxTotal)}</b> ({noFamilyHxWithComplication}/{noFamilyHxTotal})</li>
          </ul>
          <p className="text-xs text-gray-400 mt-2">Descriptive only — addresses whether family history tracks with complication burden; formal predictive modelling (logistic regression / survival analysis) should be run on the exported dataset.</p>
        </div>

        <div className="card">
          <h2 className="section-title mt-0">Poor trajectory despite advice</h2>
          <p className="text-sm"><b>{worseningDespiteAdvice}</b> of {twoPlusVisitPatients} patients with ≥2 visits show HbA1c worsening ≥0.5% despite documented lifestyle/medication advice.</p>
          <p className="text-xs text-gray-400 mt-2">Addresses: &ldquo;Which patients have poor control trajectories despite guideline advice?&rdquo; — flagged individually on each patient&rsquo;s timeline.</p>
        </div>

        <div className="card">
          <h2 className="section-title mt-0">Export de-identified dataset</h2>
          <p className="text-sm text-gray-600 mb-3">
            One row per visit, joined to baseline demographics/history. Patient name is excluded — <code className="font-mono text-xs">patient_code</code> is the only identifier, suitable for CSV import into Google Sheets or a stats package (R/Python) for baseline-predictor, trend-slope, and time-to-complication modelling.
          </p>
          <div className="flex flex-wrap gap-3">
            <ExportButton rows={rows} />
            <GoogleSheetsSyncButton rows={rows} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Google Sheets sync requires <code className="font-mono">GOOGLE_SHEETS_WEBHOOK_URL</code> to be
            set (and <code className="font-mono">GOOGLE_SHEETS_WEBHOOK_SECRET</code> for token protection;
            see README &ldquo;Google Sheets sync&rdquo; section) — otherwise use the CSV download and import
            into Sheets manually.
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mt-0">Research questions this dataset is designed to support</h2>
        <ul className="text-sm list-disc pl-5 space-y-1 text-gray-700">
          <li>Which baseline factors best predict 1-/3-/5-year diabetes complications? — requires longer follow-up accrual; baseline fields are captured now for future survival analysis.</li>
          <li>Does family history improve risk prediction beyond HbA1c and BP? — compare nested models with/without family history fields in the export.</li>
          <li>Which patients have poor control trajectories despite guideline advice? — see trajectory panel above and per-patient trend flags.</li>
          <li>What proportion meet diabetes/BP/lipid targets at follow-up? — see target attainment panel above.</li>
          <li>Which advice combinations associate with improvement? — cross-tabulate <code className="font-mono text-xs">advice_med_class_suggested</code>/diet/exercise against ΔHbA1c, ΔLDL-C per visit pair in the export.</li>
          <li>Can visit frequency and lab trend slope predict escalation of therapy? — derive slope from the visit-level export (visit_date, hba1c, sbp, ldl_c) and correlate with follow_up_urgency/advice fields.</li>
        </ul>
      </div>
    </div>
  );
}

function pct(n: number, total: number) {
  if (total === 0) return "—";
  return `${Math.round((n / total) * 100)}%`;
}

function buildDeidentifiedRows(patients: Patient[], visits: Visit[]) {
  const pMap = new Map(patients.map((p) => [p.id, p]));
  return visits.map((v) => {
    const p = pMap.get(v.patient_id);
    return {
      patient_code: p?.patient_code ?? "",
      age: p?.age ?? "",
      sex: p?.sex ?? "",
      diabetes_duration_years: p?.diabetes_duration_years ?? "",
      hypertension_duration_years: p?.hypertension_duration_years ?? "",
      family_history_diabetes: p?.family_history_diabetes ?? "",
      family_history_htn: p?.family_history_htn ?? "",
      family_history_premature_ascvd: p?.family_history_premature_ascvd ?? "",
      smoking_status: p?.smoking_status ?? "",
      ascvd_history: p?.ascvd_history ?? "",
      visit_date: v.visit_date,
      hba1c: v.hba1c ?? "",
      fasting_glucose: v.fasting_glucose ?? "",
      postprandial_glucose: v.postprandial_glucose ?? "",
      hypoglycaemia_episodes: v.hypoglycaemia_episodes ?? "",
      sbp: v.sbp ?? "",
      dbp: v.dbp ?? "",
      ldl_c: v.ldl_c ?? "",
      hdl_c: v.hdl_c ?? "",
      triglycerides: v.triglycerides ?? "",
      egfr: v.egfr ?? "",
      uacr: v.urine_albumin_creatinine_ratio ?? "",
      neuropathy: v.neuropathy,
      retinopathy: v.retinopathy,
      advice_diet: v.advice_diet,
      advice_exercise: v.advice_exercise,
      advice_med_class_suggested: v.advice_med_class_suggested ?? "",
      follow_up_urgency: v.follow_up_urgency,
    };
  });
}
