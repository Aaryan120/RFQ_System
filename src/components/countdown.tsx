"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function parts(ms: number) {
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  const totalSec = Math.floor(ms / 1000);
  return {
    d: Math.floor(totalSec / 86400),
    h: Math.floor((totalSec % 86400) / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
    done: false,
  };
}

function fmt(ms: number): string {
  const p = parts(ms);
  if (p.done) return "0s";
  if (p.d > 0) return `${p.d}d ${p.h}h ${p.m}m`;
  if (p.h > 0) return `${p.h}h ${p.m}m ${p.s}s`;
  if (p.m > 0) return `${p.m}m ${p.s}s`;
  return `${p.s}s`;
}

export function Countdown({
  target,
  label,
  className,
}: {
  target: string | Date;
  label?: string;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const targetMs = typeof target === "string" ? Date.parse(target) : target.getTime();
  const remaining = targetMs - now;
  return (
    <span className={className}>
      {label && <span className="text-slate-500">{label}: </span>}
      <span className={remaining <= 0 ? "text-rose-600" : "text-slate-900"}>
        {remaining <= 0 ? "elapsed" : fmt(remaining)}
      </span>
    </span>
  );
}

/**
 * Big, block-style countdown for the auction details "war room" header.
 */
export function CountdownBlocks({
  target,
  warnUnderSeconds = 600,
  className,
}: {
  target: string | Date;
  warnUnderSeconds?: number;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const targetMs = typeof target === "string" ? Date.parse(target) : target.getTime();
  const remaining = targetMs - now;
  const p = parts(remaining);
  const warn = !p.done && remaining < warnUnderSeconds * 1000;
  const done = p.done;

  const cell = (val: number, unit: string) => (
    <div
      className={cn(
        "flex min-w-[52px] flex-col items-center rounded-lg px-2 py-1.5",
        done
          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
          : warn
            ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
            : "bg-slate-900 text-white",
      )}
    >
      <span className="text-lg font-bold tabular-nums leading-none">
        {String(val).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wide opacity-80">
        {unit}
      </span>
    </div>
  );

  if (done) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <span className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
          Time elapsed
        </span>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {p.d > 0 && cell(p.d, "days")}
      {cell(p.h, "hrs")}
      {cell(p.m, "min")}
      {cell(p.s, "sec")}
    </div>
  );
}
