"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfigNotice from "@/components/ConfigNotice";
import { isSupabaseConfigured, supabase, supabaseConfigError } from "@/lib/supabaseClient";

export default function NewVisitPage({ params }: { params: { id: string } }) {
  if (!isSupabaseConfigured) return <ConfigNotice message={supabaseConfigError} />;

  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    visit_date: new Date().toISOString().slice(0, 10),
    test_date: "",
    clinician_notes: "",
    follow_up_interval_weeks: "",
    weight_kg: "",
    fasting_glucose: "",
    postprandial_glucose: "",
    hba1c: "",
    hypoglycaemia_episodes: "0",
    sbp: "",
    dbp: "",
    home_sbp: "",
    home_dbp: "",
    ldl_c: "",
    hdl_c: "",
    triglycerides: "",
    non_hdl_c: "",
    creatinine: "",
    egfr: "",
    urine_albumin_creatinine_ratio: "",
    neuropathy: false,
    retinopathy: false,
    advice_diet: true,
    advice_exercise: true,
    advice_med_class_suggested: "",
    follow_up_urgency: "routine",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  const num = (v: string) => (v === "" ? null : Number(v));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("visits").insert({
      patient_id: params.id,
      visit_date: form.visit_date,
      test_date: form.test_date || null,
      clinician_notes: form.clinician_notes || null,
      follow_up_interval_weeks: num(form.follow_up_interval_weeks),
      weight_kg: num(form.weight_kg),
      fasting_glucose: num(form.fasting_glucose),
      postprandial_glucose: num(form.postprandial_glucose),
      hba1c: num(form.hba1c),
      hypoglycaemia_episodes: num(form.hypoglycaemia_episodes),
      sbp: num(form.sbp),
      dbp: num(form.dbp),
      home_sbp: num(form.home_sbp),
      home_dbp: num(form.home_dbp),
      ldl_c: num(form.ldl_c),
      hdl_c: num(form.hdl_c),
      triglycerides: num(form.triglycerides),
      non_hdl_c: num(form.non_hdl_c),
      creatinine: num(form.creatinine),
      egfr: num(form.egfr),
      urine_albumin_creatinine_ratio: num(form.urine_albumin_creatinine_ratio),
      neuropathy: form.neuropathy,
      retinopathy: form.retinopathy,
      advice_diet: form.advice_diet,
      advice_exercise: form.advice_exercise,
      advice_med_class_suggested: form.advice_med_class_suggested || null,
      follow_up_urgency: form.follow_up_urgency,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/patients/${params.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto card">
      <h1 className="font-serif text-xl font-semibold text-teal-700">Add Visit / Labs</h1>
      <form onSubmit={handleSubmit}>
        <h2 className="section-title">Timeline</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Visit date" type="date" value={form.visit_date} onChange={(v) => set("visit_date", v)} required />
          <Field label="Test date" type="date" value={form.test_date} onChange={(v) => set("test_date", v)} />
          <Field label="Follow-up interval (weeks)" type="number" value={form.follow_up_interval_weeks} onChange={(v) => set("follow_up_interval_weeks", v)} />
          <Field label="Weight (kg)" type="number" value={form.weight_kg} onChange={(v) => set("weight_kg", v)} />
        </div>
        <div>
          <label className="label">Clinician notes</label>
          <textarea className="input" rows={2} value={form.clinician_notes} onChange={(e) => set("clinician_notes", e.target.value)} />
        </div>

        <h2 className="section-title">Diabetes</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fasting glucose (mg/dL)" type="number" value={form.fasting_glucose} onChange={(v) => set("fasting_glucose", v)} />
          <Field label="Postprandial glucose (mg/dL)" type="number" value={form.postprandial_glucose} onChange={(v) => set("postprandial_glucose", v)} />
          <Field label="HbA1c (%)" type="number" step="0.1" value={form.hba1c} onChange={(v) => set("hba1c", v)} />
          <Field label="Hypoglycaemia episodes" type="number" value={form.hypoglycaemia_episodes} onChange={(v) => set("hypoglycaemia_episodes", v)} />
        </div>

        <h2 className="section-title">Hypertension</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Clinic SBP" type="number" value={form.sbp} onChange={(v) => set("sbp", v)} />
          <Field label="Clinic DBP" type="number" value={form.dbp} onChange={(v) => set("dbp", v)} />
          <Field label="Home SBP" type="number" value={form.home_sbp} onChange={(v) => set("home_sbp", v)} />
          <Field label="Home DBP" type="number" value={form.home_dbp} onChange={(v) => set("home_dbp", v)} />
        </div>

        <h2 className="section-title">Lipids</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="LDL-C (mg/dL)" type="number" value={form.ldl_c} onChange={(v) => set("ldl_c", v)} />
          <Field label="HDL-C (mg/dL)" type="number" value={form.hdl_c} onChange={(v) => set("hdl_c", v)} />
          <Field label="Triglycerides (mg/dL)" type="number" value={form.triglycerides} onChange={(v) => set("triglycerides", v)} />
          <Field label="Non-HDL-C (mg/dL)" type="number" value={form.non_hdl_c} onChange={(v) => set("non_hdl_c", v)} />
        </div>

        <h2 className="section-title">Kidney & complications</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Creatinine (mg/dL)" type="number" step="0.01" value={form.creatinine} onChange={(v) => set("creatinine", v)} />
          <Field label="eGFR (mL/min/1.73m²)" type="number" value={form.egfr} onChange={(v) => set("egfr", v)} />
          <Field label="UACR (mg/g)" type="number" value={form.urine_albumin_creatinine_ratio} onChange={(v) => set("urine_albumin_creatinine_ratio", v)} />
        </div>
        <div className="flex gap-6 mt-3">
          <Checkbox label="Neuropathy" checked={form.neuropathy} onChange={(v) => set("neuropathy", v)} />
          <Checkbox label="Retinopathy" checked={form.retinopathy} onChange={(v) => set("retinopathy", v)} />
        </div>

        <h2 className="section-title">Advice delivered</h2>
        <div className="flex gap-6">
          <Checkbox label="Diet counselling" checked={form.advice_diet} onChange={(v) => set("advice_diet", v)} />
          <Checkbox label="Exercise counselling" checked={form.advice_exercise} onChange={(v) => set("advice_exercise", v)} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <label className="label">Medication class suggested</label>
            <input className="input" placeholder="e.g. SGLT2i, ACEi/ARB, Statin intensification" value={form.advice_med_class_suggested} onChange={(e) => set("advice_med_class_suggested", e.target.value)} />
          </div>
          <div>
            <label className="label">Follow-up urgency</label>
            <select className="input" value={form.follow_up_urgency} onChange={(e) => set("follow_up_urgency", e.target.value)}>
              <option value="routine">Routine</option>
              <option value="early">Early review</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {error && <p className="text-rose-500 text-sm mt-3">{error}</p>}
        <div className="mt-6">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save visit"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, type, value, onChange, required, step }: { label: string; type: string; value: string; onChange: (v: string) => void; required?: boolean; step?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} step={step} className="input" required={required} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-400" />
      {label}
    </label>
  );
}
