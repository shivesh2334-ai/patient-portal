import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Patient, Visit } from "@/lib/types";
import { computeRiskFlags } from "@/lib/guidelines";
import FlagBadge from "@/components/FlagBadge";
import ConfigNotice from "@/components/ConfigNotice";

export const dynamic = "force-dynamic";

async function getData() {
  if (!isSupabaseConfigured) return { patients: [] as Patient[], visits: [] as Visit[] };
  const { data: patients, error: pErr } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });
  const { data: visits, error: vErr } = await supabase.from("visits").select("*");
  if (pErr || vErr) return { patients: [] as Patient[], visits: [] as Visit[] };
  return {
    patients: (patients as Patient[]) || [],
    visits: (visits as Visit[]) || [],
  };
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured) return <ConfigNotice />;
  const { patients, visits } = await getData();

  const visitsByPatient = (id: string) => visits.filter((v) => v.patient_id === id);

  const totalAtTarget = { hba1c: 0, bp: 0, ldl: 0, total: patients.length };
  patients.forEach((p) => {
    const flags = computeRiskFlags(p, visitsByPatient(p.id));
    if (flags.find((f) => f.code === "hba1c" && f.severity === "ok")) totalAtTarget.hba1c++;
    if (flags.find((f) => f.code === "bp" && f.severity === "ok")) totalAtTarget.bp++;
    if (flags.find((f) => f.code === "ldl" && f.severity === "ok")) totalAtTarget.ldl++;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-teal-700">Cohort Dashboard</h1>
          <p className="text-sm text-gray-500">Diabetes · Hypertension · Lipid management — guideline adherence at a glance</p>
        </div>
        <Link href="/patients/new" className="btn-primary">+ New Patient</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Patients tracked" value={totalAtTarget.total} />
        <StatCard label="HbA1c at target" value={pct(totalAtTarget.hba1c, totalAtTarget.total)} />
        <StatCard label="BP at target" value={pct(totalAtTarget.bp, totalAtTarget.total)} />
        <StatCard label="LDL-C at target" value={pct(totalAtTarget.ldl, totalAtTarget.total)} />
      </div>

      <div className="card">
        <h2 className="section-title mt-0">Patients</h2>
        {patients.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            No patients yet. Add your first patient, or run the seed script in{" "}
            <code className="font-mono text-xs">supabase/schema.sql</code>.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {patients.map((p) => {
              const flags = computeRiskFlags(p, visitsByPatient(p.id));
              return (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="flex items-center justify-between py-3 hover:bg-teal-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium">{p.name} <span className="text-xs text-gray-400 font-mono">{p.patient_code}</span></p>
                    <p className="text-xs text-gray-500">{p.age}y · {p.sex} · {visitsByPatient(p.id).length} visit(s)</p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end max-w-xs">
                    {flags.slice(0, 4).map((f) => <FlagBadge key={f.code} flag={f} />)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function pct(n: number, total: number) {
  if (total === 0) return "—";
  return `${Math.round((n / total) * 100)}%`;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card text-center">
      <p className="text-2xl font-serif font-semibold text-teal-700">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
