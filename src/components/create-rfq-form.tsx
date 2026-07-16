"use client";

import { useActionState } from "react";
import {
  CalendarClock,
  ClipboardList,
  Info,
  Package,
  Settings2,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import { createRfqAction, type CreateRfqActionState } from "@/lib/actions/rfq";
import { toLocalInputValue } from "@/lib/utils";
import { Spinner } from "@/components/loader";

const initialState: CreateRfqActionState = { ok: false };

const now = new Date();
const defaults = {
  bidStartAt: toLocalInputValue(new Date(now.getTime() + 5 * 60_000)),
  bidCloseAt: toLocalInputValue(new Date(now.getTime() + 60 * 60_000)),
  forcedBidCloseAt: toLocalInputValue(new Date(now.getTime() + 90 * 60_000)),
  pickupDate: toLocalInputValue(new Date(now.getTime() + 7 * 24 * 60 * 60_000)),
};

export function CreateRfqForm() {
  const [state, formAction, pending] = useActionState(createRfqAction, initialState);

  const inputCls =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-soft focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
  const errCls = "mt-1 text-xs text-rose-600";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-slate-600";

  return (
    <form action={formAction} className="space-y-6">
      {state.message && !state.ok && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.message}
        </div>
      )}

      {/* Section 1: RFQ identity */}
      <section className="card overflow-hidden">
        <SectionHeader
          icon={<ClipboardList className="h-4 w-4" />}
          title="RFQ Details"
          hint="Basic identity and product info"
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Reference ID</label>
            <input
              name="referenceId"
              required
              className={inputCls}
              placeholder="RFQ-2025-001"
            />
            {state.errors?.referenceId && (
              <div className={errCls}>{state.errors.referenceId}</div>
            )}
          </div>
          <div>
            <label className={labelCls}>Name</label>
            <input
              name="name"
              required
              className={inputCls}
              placeholder="e.g. Mumbai → Rotterdam FCL"
            />
            {state.errors?.name && <div className={errCls}>{state.errors.name}</div>}
          </div>
        </div>
      </section>

      {/* Section 2: Schedule */}
      <section className="card overflow-hidden">
        <SectionHeader
          icon={<CalendarClock className="h-4 w-4" />}
          title="Schedule"
          hint="When bidding opens, closes and can be extended to"
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Bid Start</label>
            <input
              name="bidStartAt"
              type="datetime-local"
              required
              defaultValue={defaults.bidStartAt}
              className={inputCls}
            />
            {state.errors?.bidStartAt && <div className={errCls}>{state.errors.bidStartAt}</div>}
          </div>
          <div>
            <label className={labelCls}>Bid Close</label>
            <input
              name="bidCloseAt"
              type="datetime-local"
              required
              defaultValue={defaults.bidCloseAt}
              className={inputCls}
            />
            {state.errors?.bidCloseAt && <div className={errCls}>{state.errors.bidCloseAt}</div>}
          </div>
          <div>
            <label className={labelCls}>
              Forced Bid Close <span className="text-rose-600">*</span>
            </label>
            <input
              name="forcedBidCloseAt"
              type="datetime-local"
              required
              defaultValue={defaults.forcedBidCloseAt}
              className={inputCls}
            />
            <p className="mt-1 flex items-start gap-1 text-[11px] text-slate-500">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Must be after Bid Close. Extensions never exceed this.
            </p>
            {state.errors?.forcedBidCloseAt && (
              <div className={errCls}>{state.errors.forcedBidCloseAt}</div>
            )}
          </div>
          <div>
            <label className={labelCls}>
              <span className="inline-flex items-center gap-1">
                <Package className="h-3 w-3" />
                Pickup Date
              </span>
            </label>
            <input
              name="pickupDate"
              type="datetime-local"
              required
              defaultValue={defaults.pickupDate}
              className={inputCls}
            />
            {state.errors?.pickupDate && <div className={errCls}>{state.errors.pickupDate}</div>}
          </div>
        </div>
      </section>

      {/* Section 3: British Auction Config */}
      <section className="card overflow-hidden">
        <SectionHeader
          icon={<Settings2 className="h-4 w-4" />}
          title="British Auction Configuration"
          hint="Controls when the auction extends and by how much"
        />
        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  Trigger Window (X) — minutes
                </span>
              </label>
              <input
                name="triggerWindowMinutes"
                type="number"
                min="1"
                step="1"
                defaultValue={10}
                required
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Activity in the last <b>X</b> minutes triggers extensions.
              </p>
              {state.errors?.triggerWindowMinutes && (
                <div className={errCls}>{state.errors.triggerWindowMinutes}</div>
              )}
            </div>
            <div>
              <label className={labelCls}>
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Extension Duration (Y) — minutes
                </span>
              </label>
              <input
                name="extensionDurationMinutes"
                type="number"
                min="1"
                step="1"
                defaultValue={5}
                required
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Each triggered event adds <b>Y</b> minutes (capped at forced close).
              </p>
              {state.errors?.extensionDurationMinutes && (
                <div className={errCls}>{state.errors.extensionDurationMinutes}</div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>Extension Trigger</label>
            <select
              name="extensionTrigger"
              required
              defaultValue="ANY_RANK_CHANGE"
              className={inputCls}
            >
              <option value="BID_RECEIVED">
                Bid received in last X minutes — always extends
              </option>
              <option value="ANY_RANK_CHANGE">
                Any supplier rank change in last X minutes
              </option>
              <option value="L1_RANK_CHANGE">
                Only when L1 (lowest) supplier changes
              </option>
            </select>
            {state.errors?.extensionTrigger && (
              <div className={errCls}>{state.errors.extensionTrigger}</div>
            )}
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? (
          <>
            <Spinner size="sm" className="text-white" />
            Creating RFQ…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Create RFQ
          </>
        )}
      </button>
    </form>
  );
}

function SectionHeader({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-600 shadow-soft ring-1 ring-slate-200">
        {icon}
      </span>
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-[11px] text-slate-500">{hint}</div>
      </div>
    </div>
  );
}
