"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Visit } from "@/lib/types";

export function HbA1cChart({ visits }: { visits: Visit[] }) {
  const data = visits
    .filter((v) => v.hba1c != null)
    .map((v) => ({ date: v.visit_date, HbA1c: v.hba1c }));
  if (data.length === 0) return <p className="text-sm text-gray-400">No HbA1c data yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="date" fontSize={11} />
        <YAxis fontSize={11} domain={[5, "dataMax + 1"]} />
        <Tooltip />
        <ReferenceLine y={7} stroke="#2A6A66" strokeDasharray="4 4" label={{ value: "target 7%", fontSize: 10 }} />
        <Line type="monotone" dataKey="HbA1c" stroke="#A85E33" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BPChart({ visits }: { visits: Visit[] }) {
  const data = visits
    .filter((v) => v.sbp != null)
    .map((v) => ({ date: v.visit_date, SBP: v.sbp, DBP: v.dbp }));
  if (data.length === 0) return <p className="text-sm text-gray-400">No BP data yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="date" fontSize={11} />
        <YAxis fontSize={11} />
        <Tooltip />
        <Legend />
        <ReferenceLine y={129} stroke="#2A6A66" strokeDasharray="4 4" label={{ value: "SBP target 129", fontSize: 10 }} />
        <Line type="monotone" dataKey="SBP" stroke="#C05B5B" strokeWidth={2} dot />
        <Line type="monotone" dataKey="DBP" stroke="#3E8E88" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LipidChart({ visits }: { visits: Visit[] }) {
  const data = visits
    .filter((v) => v.ldl_c != null)
    .map((v) => ({ date: v.visit_date, "LDL-C": v.ldl_c, "HDL-C": v.hdl_c, Triglycerides: v.triglycerides }));
  if (data.length === 0) return <p className="text-sm text-gray-400">No lipid data yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="date" fontSize={11} />
        <YAxis fontSize={11} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="LDL-C" stroke="#D9A441" strokeWidth={2} dot />
        <Line type="monotone" dataKey="HDL-C" stroke="#3E8E88" strokeWidth={2} dot />
        <Line type="monotone" dataKey="Triglycerides" stroke="#C77B4B" strokeWidth={1.5} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
