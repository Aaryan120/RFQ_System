import type { ReactNode } from "@/lib/types-shim";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "emerald" | "amber" | "rose" | "indigo";
}) {
  const toneCls =
    tone === "emerald"
      ? "from-emerald-500 to-emerald-700 text-emerald-50"
      : tone === "amber"
        ? "from-amber-500 to-amber-700 text-amber-50"
        : tone === "rose"
          ? "from-rose-500 to-rose-700 text-rose-50"
          : tone === "indigo"
            ? "from-brand-500 to-brand-700 text-brand-50"
            : "from-slate-700 to-slate-900 text-slate-50";
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>
        {icon && (
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br",
              toneCls,
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
