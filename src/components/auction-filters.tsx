"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/loader";
import type { RfqStatus } from "@prisma/client";

const FILTERS: { key: "ALL" | RfqStatus; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Live" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "CLOSED", label: "Closed" },
  { key: "FORCE_CLOSED", label: "Force Closed" },
];

declare global {
  interface Window {
    __routeProgress?: { start: () => void; complete: () => void };
  }
}

export function AuctionFilters({
  counts,
}: {
  counts: Record<"ALL" | RfqStatus, number>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = (params.get("status") ?? "ALL") as "ALL" | RfqStatus;

  function set(key: string) {
    const q = new URLSearchParams(params.toString());
    if (key === "ALL") q.delete("status");
    else q.set("status", key);
    const qs = q.toString();
    // Kick the top progress bar for immediate visual feedback.
    if (typeof window !== "undefined") window.__routeProgress?.start();
    startTransition(() => {
      router.push(qs ? `/auctions?${qs}` : "/auctions");
    });
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-soft transition",
        isPending && "opacity-90",
      )}
    >
      {FILTERS.map((f) => {
        const on = active === f.key;
        const pendingHere = isPending && on;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => set(f.key)}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              on
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-100",
              isPending && !on && "cursor-wait",
            )}
          >
            {pendingHere ? (
              <Spinner size="xs" className="text-white" />
            ) : null}
            {f.label}
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold",
                on ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600",
              )}
            >
              {counts[f.key] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
