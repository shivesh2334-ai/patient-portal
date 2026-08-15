import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Patient, Visit } from "@/lib/types";
import { computeRiskFlags, ldlTarget, bpTarget, computeBMI } from "@/lib/guidelines";
import FlagBadge from "@/components/FlagBadge";
import { HbA1cChart, BPChart, LipidChart } from "@/components/TimelineChart";
import ConfigNotice from "@/components/ConfigNotice";

export const dynamic = "force-dynamic";

async function getPatient(id: string) {
  const { data: patient, error: patientError } = await supabase.from("patients").select("*").eq("id", id).single();
  const { data: visits, error: visitsError } = await supabase
    .from("visits")
    .select("*")
    .eq("patient_id", id)
    .order("visit_date", { ascending: true });
  if (patientError || visitsError) {
    console.error(`Failed to load patient detail data for ${id}.`, { patientError, visitsError });
  }
  return { patient: patient as Patient, visits: (visits as Visit[]) || [] };
}

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  if (!isSupabaseConfigured) return <ConfigNotice />;
  const { patient, visits } = await getPatient(params.id);
  if (!patient) {
    return <p>Patient not found.</p>;
  }

  const flags = computeRiskFlags(patient, visits);
  const { target: ldlT, tier } = ldlTarget(patient);
  const { sbpTarget } = bpTarget(patient);
  const latest = visits[visits.length - 1];
  const bmi = latest ? computeBMI(latest.weight_kg, patient.height_cm) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-teal-700">
            {patient.name} <span className="text-sm text-gray-400 font-mono">{patient.patient_code}</span>
          </h1>
          <p className="text-sm text-gray-500">
            {patient.age}y {patient.sex} · BMI {bmi ?? "—"} · DM duration {patient.diabetes_duration_years ?? "—"}y · HTN duration {patient.hypertension_duration_years ?? "—"}y
          </p>
        </div>
        <Link href={`/patients/${patient.id}/visits/new`} className="btn-primary">+ Add Visit</Link>
      </div>

      <div className="card mb-4">
        <h2 className="section-title mt-0">Guideline flags (latest visit)</h2>
        <div className="flex gap-2 flex-wrap">
          {flags.map((f) => <FlagBadge key={f.code} flag={f} />)}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Targets applied — BP: SBP ≤{sbpTarget} mmHg (ESC 2024) · LDL-C: ≤{ldlT} mg/dL ({tier}) · HbA1c: &lt;7% (RSSDI-aligned, individualise for hypoglycaemia risk).
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="card">
          <h3 className="font-medium text-sm mb-2">HbA1c trend</h3>
          <HbA1cChart visits={visits} />
        </div>
        <div className="card">
          <h3 className="font-medium text-sm mb-2">BP trend</h3>
          <BPChart visits={visits} />
        </div>
        <div className="card">
          <h3 className="font-medium text-sm mb-2">Lipid trend</h3>
          <LipidChart visits={visits} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h2 className="section-title mt-0">History</h2>
          <ul className="text-sm space-y-1">
            <li>Family history — Diabetes: {yn(patient.family_history_diabetes)}, HTN: {yn(patient.family_history_htn)}, Premature ASCVD: {yn(patient.family_history_premature_ascvd)}</li>
            <li>Established ASCVD: {yn(patient.ascvd_history)}</li>
            <li>Smoking: {patient.smoking_status} · Alcohol: {patient.alcohol_use}</li>
            <li>Comorbidities: {(patient.comorbidities || []).join(", ") || "—"}</li>
            <li>Medications: {(patient.medications || []).join(", ") || "—"}</li>
          </ul>
        </div>
        <div className="card">
          <h2 className="section-title mt-0">Latest complications screen</h2>
          {latest ? (
            <ul className="text-sm space-y-1">
              <li>eGFR: {latest.egfr ?? "—"} mL/min/1.73m² · Creatinine: {latest.creatinine ?? "—"} mg/dL</li>
              <li>UACR: {latest.urine_albumin_creatinine_ratio ?? "—"} mg/g</li>
              <li>Neuropathy: {yn(latest.neuropathy)} · Retinopathy: {yn(latest.retinopathy)}</li>
              <li>Advice given: {[latest.advice_diet && "Diet", latest.advice_exercise && "Exercise", latest.advice_med_class_suggested].filter(Boolean).join(", ") || "—"}</li>
              <li>Follow-up urgency: {latest.follow_up_urgency}</li>
            </ul>
          ) : <p className="text-sm text-gray-400">No visits yet.</p>}
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mt-0">Visit timeline</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">HbA1c</th>
                <th className="py-2 pr-3">FPG/PPG</th>
                <th className="py-2 pr-3">BP</th>
                <th className="py-2 pr-3">LDL-C</th>
                <th className="py-2 pr-3">eGFR</th>
                <th className="py-2 pr-3">Advice</th>
                <th className="py-2 pr-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {[...visits].reverse().map((v) => (
                <tr key={v.id} className="border-b border-gray-50">
                  <td className="py-2 pr-3 whitespace-nowrap">{v.visit_date}</td>
                  <td className="py-2 pr-3">{v.hba1c ?? "—"}</td>
                  <td className="py-2 pr-3">{v.fasting_glucose ?? "—"}/{v.postprandial_glucose ?? "—"}</td>
                  <td className="py-2 pr-3">{v.sbp ?? "—"}/{v.dbp ?? "—"}</td>
                  <td className="py-2 pr-3">{v.ldl_c ?? "—"}</td>
                  <td className="py-2 pr-3">{v.egfr ?? "—"}</td>
                  <td className="py-2 pr-3">{v.advice_med_class_suggested ?? (v.advice_diet || v.advice_exercise ? "Lifestyle" : "—")}</td>
                  <td className="py-2 pr-3 max-w-xs truncate" title={v.clinician_notes ?? ""}>{v.clinician_notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function yn(v: boolean) {
  return v ? "Yes" : "No";
}
