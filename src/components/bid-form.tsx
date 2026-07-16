"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Send, Sparkles, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Spinner } from "@/components/loader";

interface FieldErrors {
  [key: string]: string;
}

export function BidForm({
  rfqId,
  currentBest,
}: {
  rfqId: string;
  currentBest?: number;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [extensionNote, setExtensionNote] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [freight, setFreight] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");

  const total = useMemo(() => {
    const sum = Number(freight || 0) + Number(origin || 0) + Number(destination || 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [freight, origin, destination]);

  const beatsCurrent = currentBest !== undefined && total > 0 && total < currentBest;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    setExtensionNote(null);
    setSuccessNote(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = {
      carrierName: fd.get("carrierName"),
      freightCharges: Number(fd.get("freightCharges") ?? 0),
      originCharges: Number(fd.get("originCharges") ?? 0),
      destinationCharges: Number(fd.get("destinationCharges") ?? 0),
      transitTimeDays: Number(fd.get("transitTimeDays") ?? 0),
      quoteValidity: fd.get("quoteValidity"),
    };

    try {
      const res = await fetch(`/api/rfqs/${rfqId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setMessage(data.error ?? "Failed to submit bid");
        return;
      }
      form.reset();
      setFreight("");
      setOrigin("");
      setDestination("");
      if (data.extension?.applied) {
        setExtensionNote(
          `Auction extended to ${new Date(data.extension.newCloseAt).toLocaleTimeString()}${
            data.extension.cappedAtForced ? " (capped at forced close)" : ""
          } — ${data.extension.reason}`,
        );
      } else {
        setSuccessNote("Bid submitted successfully.");
      }
      router.refresh();
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm shadow-soft focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
  const errCls = "mt-1 text-xs text-rose-600";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-slate-600";

  return (
    <form onSubmit={onSubmit} className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Send className="h-4 w-4 text-brand-600" />
          Submit Bid
        </h3>
        {currentBest !== undefined && (
          <span className="text-[11px] font-medium text-slate-500">
            Beat {formatCurrency(currentBest)}
          </span>
        )}
      </div>

      {message && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {message}
        </div>
      )}
      {successNote && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {successNote}
        </div>
      )}
      {extensionNote && (
        <div className="flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-800">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {extensionNote}
        </div>
      )}

      <div>
        <label className={labelCls}>Carrier Name</label>
        <input
          name="carrierName"
          required
          placeholder="e.g. Acme Ocean Line"
          className={inputCls}
        />
        {errors.carrierName && <div className={errCls}>{errors.carrierName}</div>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelCls}>Freight</label>
          <input
            name="freightCharges"
            type="number"
            step="0.01"
            min="0"
            required
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
            className={inputCls}
          />
          {errors.freightCharges && <div className={errCls}>{errors.freightCharges}</div>}
        </div>
        <div>
          <label className={labelCls}>Origin</label>
          <input
            name="originCharges"
            type="number"
            step="0.01"
            min="0"
            required
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className={inputCls}
          />
          {errors.originCharges && <div className={errCls}>{errors.originCharges}</div>}
        </div>
        <div>
          <label className={labelCls}>Destination</label>
          <input
            name="destinationCharges"
            type="number"
            step="0.01"
            min="0"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className={inputCls}
          />
          {errors.destinationCharges && <div className={errCls}>{errors.destinationCharges}</div>}
        </div>
      </div>

      {/* Live running total */}
      <div
        className={
          "rounded-lg border p-3 transition " +
          (beatsCurrent
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200 bg-slate-50")
        }
      >
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Your total
          </div>
          <div
            className={
              "flex items-center gap-1 text-lg font-bold tabular-nums " +
              (beatsCurrent ? "text-emerald-700" : "text-slate-900")
            }
          >
            {beatsCurrent && <TrendingDown className="h-4 w-4" />}
            {formatCurrency(total)}
          </div>
        </div>
        {currentBest !== undefined && total > 0 && (
          <div className="mt-1 text-[11px] text-slate-600">
            {beatsCurrent ? (
              <span className="text-emerald-700">
                Beats current best by {formatCurrency(currentBest - total)} 🎉
              </span>
            ) : total > currentBest ? (
              <span className="text-slate-500">
                {formatCurrency(total - currentBest)} above current best
              </span>
            ) : (
              <span className="text-slate-500">Ties current best</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Transit (days)</label>
          <input
            name="transitTimeDays"
            type="number"
            step="1"
            min="1"
            required
            className={inputCls}
          />
          {errors.transitTimeDays && <div className={errCls}>{errors.transitTimeDays}</div>}
        </div>
        <div>
          <label className={labelCls}>Valid Until</label>
          <input
            name="quoteValidity"
            type="datetime-local"
            required
            className={inputCls}
          />
          {errors.quoteValidity && <div className={errCls}>{errors.quoteValidity}</div>}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
      >
        {submitting ? (
          <>
            <Spinner size="sm" className="text-white" />
            Submitting bid…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Bid
          </>
        )}
      </button>
    </form>
  );
}
