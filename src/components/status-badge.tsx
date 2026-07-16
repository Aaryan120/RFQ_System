import type { RfqStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STYLES: Record<
  RfqStatus,
  { label: string; className: string; dot: string; pulse?: boolean }
> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
  },
  ACTIVE: {
    label: "Live",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    dot: "bg-emerald-500",
    pulse: true,
  },
  CLOSED: {
    label: "Closed",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-500",
  },
  FORCE_CLOSED: {
    label: "Force Closed",
    className: "bg-rose-50 text-rose-800 ring-rose-200",
    dot: "bg-rose-500",
  },
};

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: RfqStatus;
  size?: "sm" | "md";
}) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        s.className,
      )}
    >
      <span className="relative flex h-2 w-2">
        {s.pulse && (
          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", s.dot)} />
      </span>
      {s.label}
    </span>
  );
}

export function RankBadge({
  rank,
  size = "sm",
}: {
  rank: number;
  size?: "sm" | "md" | "lg";
}) {
  const label = `L${rank}`;
  const cls =
    rank === 1
      ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-200"
      : rank === 2
        ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-200"
        : rank === 3
          ? "bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-amber-200"
          : "bg-slate-200 text-slate-700";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-bold shadow-sm",
        size === "sm"
          ? "min-w-[28px] px-1.5 py-0.5 text-xs"
          : size === "md"
            ? "min-w-[36px] px-2 py-1 text-sm"
            : "min-w-[52px] px-3 py-1.5 text-base",
        cls,
      )}
    >
      {label}
    </span>
  );
}
