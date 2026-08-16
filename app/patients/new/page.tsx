"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfigNotice from "@/components/ConfigNotice";
import { isSupabaseConfigured, supabase, supabaseConfigError } from "@/lib/supabaseClient";

export default function NewPatientPage() {
  if (!isSupabaseConfigured) return <ConfigNotice message={supabaseConfigError} />;

  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    sex: "female",
    height_cm: "",
    weight_kg: "",
    diabetes_duration_years: "",
    hypertension_duration_years: "",
    family_history_diabetes: false,
    family_history_htn: false,
    family_history_premature_ascvd: false,
    smoking_status: "never",
    alcohol_use: "none",
    comorbidities: "",
    medications: "",
    ascvd_history: false,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // generate a simple sequential-looking de-identified code
    const patient_code = `P-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data, error } = await supabase
      .from("patients")
      .insert({
        patient_code,
        name: form.name,
        age: Number(form.age),
        sex: form.sex,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        diabetes_duration_years: form.diabetes_duration_years ? Number(form.diabetes_duration_years) : null,
        hypertension_duration_years: form.hypertension_duration_years ? Number(form.hypertension_duration_years) : null,
        family_history_diabetes: form.family_history_diabetes,
        family_history_htn: form.family_history_htn,
        family_history_premature_ascvd: form.family_history_premature_ascvd,
        smoking_status: form.smoking_status,
        alcohol_use: form.alcohol_use,
        comorbidities: form.comorbidities ? form.comorbidities.split(",").map((s) => s.trim()) : [],
        medications: form.medications ? form.medications.split(",").map((s) => s.trim()) : [],
        ascvd_history: form.ascvd_history,
      })
      .select()
      .single();

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/patients/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto card">
      <h1 className="font-serif text-xl font-semibold text-teal-700">New Patient — Baseline Intake</h1>
      <p className="text-sm text-gray-500">Demographics and history. Labs and vitals are captured per-visit.</p>

      <form onSubmit={handleSubmit}>
        <h2 className="section-title">Demographics</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="label">Age</label>
            <input type="number" className="input" required value={form.age} onChange={(e) => set("age", e.target.value)} />
          </div>
          <div>
            <label className="label">Sex</label>
            <select className="input" value={form.sex} onChange={(e) => set("sex", e.target.value)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Height (cm)</label>
            <input type="number" className="input" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" className="input" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
          </div>
          <div>
            <label className="label">Diabetes duration (yrs)</label>
            <input type="number" className="input" value={form.diabetes_duration_years} onChange={(e) => set("diabetes_duration_years", e.target.value)} />
          </div>
          <div>
            <label className="label">Hypertension duration (yrs)</label>
            <input type="number" className="input" value={form.hypertension_duration_years} onChange={(e) => set("hypertension_duration_years", e.target.value)} />
          </div>
        </div>

        <h2 className="section-title">History</h2>
        <div className="grid grid-cols-2 gap-3">
          <Checkbox label="Family history: diabetes" checked={form.family_history_diabetes} onChange={(v) => set("family_history_diabetes", v)} />
          <Checkbox label="Family history: hypertension" checked={form.family_history_htn} onChange={(v) => set("family_history_htn", v)} />
          <Checkbox label="Family history: premature ASCVD" checked={form.family_history_premature_ascvd} onChange={(v) => set("family_history_premature_ascvd", v)} />
          <Checkbox label="Established ASCVD (prior MI/stroke/PAD)" checked={form.ascvd_history} onChange={(v) => set("ascvd_history", v)} />
          <div>
            <label className="label">Smoking</label>
            <select className="input" value={form.smoking_status} onChange={(e) => set("smoking_status", e.target.value)}>
              <option value="never">Never</option>
              <option value="former">Former</option>
              <option value="current">Current</option>
            </select>
          </div>
          <div>
            <label className="label">Alcohol</label>
            <select className="input" value={form.alcohol_use} onChange={(e) => set("alcohol_use", e.target.value)}>
              <option value="none">None</option>
              <option value="occasional">Occasional</option>
              <option value="regular">Regular</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Comorbidities (comma-separated)</label>
          <input className="input" placeholder="CKD stage 2, PCOS" value={form.comorbidities} onChange={(e) => set("comorbidities", e.target.value)} />
        </div>
        <div>
          <label className="label">Current medications (comma-separated)</label>
          <input className="input" placeholder="Metformin, Telmisartan" value={form.medications} onChange={(e) => set("medications", e.target.value)} />
        </div>

        {error && <p className="text-rose-500 text-sm mt-3">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save patient & add baseline visit"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm mt-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-400" />
      {label}
    </label>
  );
}
