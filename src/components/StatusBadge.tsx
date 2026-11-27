import type { TrafficStatus } from "@/lib/deadlines";

const STYLES: Record<TrafficStatus, [string, string]> = {
  green: ["bg-emerald-100 text-emerald-800", "Entspannt"],
  yellow: ["bg-amber-100 text-amber-800", "Bald fällig"],
  red: ["bg-red-100 text-red-800", "Frist läuft ab"],
  ending: ["bg-sky-100 text-sky-800", "Endet automatisch"],
  expired: ["bg-slate-100 text-slate-500", "Abgelaufen"],
  cancelled: ["bg-slate-100 text-slate-500", "Gekündigt"],
};

export function StatusBadge({ status }: { status: TrafficStatus }) {
  const [cls, label] = STYLES[status];
  const dot = { green: "bg-emerald-500", yellow: "bg-amber-500", red: "bg-red-500" }[status as "green"] ?? "bg-slate-400";
  return (
    <span data-status={status} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
