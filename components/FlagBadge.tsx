import { RiskFlag } from "@/lib/types";

export default function FlagBadge({ flag }: { flag: RiskFlag }) {
  const cls =
    flag.severity === "ok"
      ? "badge-ok"
      : flag.severity === "warn"
      ? "badge-warn"
      : "badge-alert";
  return (
    <span className={`badge ${cls}`} title={flag.detail}>
      {flag.label}
    </span>
  );
}
