import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CalendarClock,
  ChevronDown,
  Clock,
  Flame,
  History,
  Package,
  Settings2,
  ShieldAlert,
  Timer,
  TrendingDown,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncAuctionStatus } from "@/lib/auction/engine";
import { rankBids } from "@/lib/auction/ranking";
import { StatusBadge, RankBadge } from "@/components/status-badge";
import { CountdownBlocks } from "@/components/countdown";
import { AutoRefresh } from "@/components/auto-refresh";
import { BidForm } from "@/components/bid-form";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { ActivityEventType, ExtensionTrigger } from "@prisma/client";

export const dynamic = "force-dynamic";

const EVENT_META: Record<
  ActivityEventType,
  { label: string; className: string; Icon: typeof Zap }
> = {
  BID_SUBMITTED: {
    label: "Bid",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    Icon: TrendingDown,
  },
  TIME_EXTENDED: {
    label: "Extended",
    className: "bg-brand-100 text-brand-800 ring-brand-200",
    Icon: Zap,
  },
  AUCTION_CLOSED: {
    label: "Closed",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
    Icon: Clock,
  },
  FORCE_CLOSED: {
    label: "Force Closed",
    className: "bg-rose-100 text-rose-800 ring-rose-200",
    Icon: ShieldAlert,
  },
};

const TRIGGER_LABEL: Record<ExtensionTrigger, string> = {
  BID_RECEIVED: "Any bid received",
  ANY_RANK_CHANGE: "Any rank change",
  L1_RANK_CHANGE: "L1 (lowest) changes",
};

export default async function AuctionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  await syncAuctionStatus(id);

  const rfq = await prisma.rfq.findUnique({
    where: { id },
    include: {
      config: true,
      createdBy: true,
      bids: {
        include: { supplier: true },
        orderBy: { submittedAt: "desc" },
      },
      activityLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!rfq) notFound();
  if (!rfq.config) notFound();

  const ranking = rankBids(
    rfq.bids.map((b) => ({
      supplierId: b.supplierId,
      totalPrice: Number(b.totalPrice),
      submittedAt: b.submittedAt,
    })),
  );
  const rankBySupplier = new Map(ranking.map((r) => [r.supplierId, r.rank]));

  const latestBidBySupplier = new Map<string, (typeof rfq.bids)[number]>();
  for (const b of rfq.bids) {
    const prev = latestBidBySupplier.get(b.supplierId);
    if (!prev || b.submittedAt > prev.submittedAt)
      latestBidBySupplier.set(b.supplierId, b);
  }
  const currentStandings = [...latestBidBySupplier.values()].sort(
    (a, b) =>
      (rankBySupplier.get(a.supplierId) ?? 99) -
      (rankBySupplier.get(b.supplierId) ?? 99),
  );

  const lowest = currentStandings[0];
  const isActive = rfq.status === "ACTIVE";
  const mySupplierBid =
    session.user.role === "SUPPLIER"
      ? currentStandings.find((b) => b.supplierId === session.user.id)
      : undefined;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalSeconds={10} />

      <div className="flex items-center justify-between">
        <Link
          href="/auctions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to auctions
        </Link>
        <div className="text-xs text-slate-500">
          Auto-refreshing every 10s
        </div>
      </div>

      {/* ============== HEADER (live command center) ============== */}
      <div className="card overflow-hidden">
        <div
          className={
            "border-b border-slate-100 " +
            (isActive
              ? "bg-gradient-to-r from-emerald-50 via-white to-white"
              : rfq.status === "FORCE_CLOSED"
                ? "bg-gradient-to-r from-rose-50 via-white to-white"
                : "bg-gradient-to-r from-slate-50 via-white to-white")
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <StatusBadge status={rfq.status} size="md" />
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                  {rfq.referenceId}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {rfq.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Created by {rfq.createdBy.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Pickup {formatDateTime(rfq.pickupDate)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {isActive
                  ? "Time until bid close"
                  : rfq.status === "SCHEDULED"
                    ? "Opens at"
                    : "Closed"}
              </div>
              <div className="mt-2 flex justify-end">
                {isActive ? (
                  <CountdownBlocks target={rfq.bidCloseAt} />
                ) : rfq.status === "SCHEDULED" ? (
                  <div className="text-lg font-semibold text-slate-900">
                    {formatDateTime(rfq.bidStartAt)}
                  </div>
                ) : (
                  <div className="text-lg font-semibold text-slate-500">
                    {formatDateTime(rfq.bidCloseAt)}
                  </div>
                )}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Hard cap:{" "}
                <span className="font-semibold text-slate-700">
                  {formatDateTime(rfq.forcedBidCloseAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Info strip */}
          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
            <InfoTile
              icon={<Trophy className="h-4 w-4" />}
              label="Current L1"
              value={
                lowest
                  ? formatCurrency(Number(lowest.totalPrice))
                  : "—"
              }
              hint={lowest ? lowest.supplier.name : "No bids yet"}
              tone="emerald"
            />
            <InfoTile
              icon={<Timer className="h-4 w-4" />}
              label="Trigger Window"
              value={`${rfq.config.triggerWindowMinutes} min`}
              hint="Extension monitor"
            />
            <InfoTile
              icon={<Zap className="h-4 w-4" />}
              label="Extension"
              value={`+${rfq.config.extensionDurationMinutes} min`}
              hint="Per triggered event"
              tone="indigo"
            />
            <InfoTile
              icon={<Settings2 className="h-4 w-4" />}
              label="Trigger Rule"
              value={TRIGGER_LABEL[rfq.config.extensionTrigger]}
              hint={rfq.config.extensionTrigger}
            />
          </div>
        </div>
      </div>

      {/* ============== MAIN GRID ============== */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* Standings */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Trophy className="h-4 w-4 text-emerald-600" />
                  Live Standings
                </h2>
                <p className="text-xs text-slate-500">
                  Ranked by each supplier&apos;s latest bid — lowest total wins.
                </p>
              </div>
              <div className="text-xs text-slate-500">
                {currentStandings.length} supplier
                {currentStandings.length === 1 ? "" : "s"}
              </div>
            </div>

            {currentStandings.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-slate-500">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <Award className="h-5 w-5 text-slate-400" />
                </div>
                <div>No bids yet — be the first.</div>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {currentStandings.map((b) => {
                  const rank = rankBySupplier.get(b.supplierId) ?? 0;
                  const isMine = b.supplierId === session.user.id;
                  const isL1 = rank === 1;
                  return (
                    <li
                      key={b.id}
                      className={
                        "flex flex-wrap items-center gap-3 px-5 py-3 transition " +
                        (isL1 ? "bg-emerald-50/40" : "hover:bg-slate-50/60")
                      }
                    >
                      <RankBadge rank={rank} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-slate-900">
                            {b.supplier.name}
                          </span>
                          {isMine && (
                            <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-700">
                              You
                            </span>
                          )}
                          {isL1 && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                              <Flame className="h-2.5 w-2.5" />
                              Leading
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {b.carrierName} · {b.transitTimeDays}d transit ·
                          submitted {formatDateTime(b.submittedAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold tabular-nums text-slate-900">
                          {formatCurrency(Number(b.totalPrice))}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          F {formatCurrency(Number(b.freightCharges))} · O{" "}
                          {formatCurrency(Number(b.originCharges))} · D{" "}
                          {formatCurrency(Number(b.destinationCharges))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* History (only if we have older bids) */}
          {rfq.bids.length > currentStandings.length && (
            <BidHistory bids={rfq.bids} />
          )}

          {/* Activity log */}
          <section className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <History className="h-4 w-4 text-slate-500" />
                Activity Log
              </h2>
              <p className="text-xs text-slate-500">
                Every bid, extension and status change with a reason.
              </p>
            </div>
            {rfq.activityLogs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No activity yet.
              </div>
            ) : (
              <ol className="relative px-5 py-4">
                {rfq.activityLogs.map((log, i) => {
                  const meta = EVENT_META[log.eventType];
                  const Icon = meta.Icon;
                  const last = i === rfq.activityLogs.length - 1;
                  return (
                    <li key={log.id} className="relative pb-4 pl-8 last:pb-0">
                      {!last && (
                        <span
                          className="absolute left-3 top-6 bottom-0 w-px bg-slate-200"
                          aria-hidden
                        />
                      )}
                      <span
                        className={
                          "absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white " +
                          meta.className
                        }
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-sm text-slate-700">
                        {log.description}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {session.user.role === "SUPPLIER" && isActive && (
            <BidForm rfqId={rfq.id} currentBest={mySupplierBid ? Number(mySupplierBid.totalPrice) : undefined} />
          )}
          {session.user.role === "SUPPLIER" && !isActive && (
            <div className="card p-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-slate-500" />
                <div className="text-sm font-semibold text-slate-800">
                  Bidding closed
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                This auction is currently{" "}
                <StatusBadge status={rfq.status} />. New bids are not accepted.
              </p>
            </div>
          )}
          {session.user.role === "BUYER" && (
            <div className="card p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-brand-500" />
                <div className="text-sm font-semibold text-slate-800">
                  Buyer view
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                You&apos;re observing this auction as the buyer. Only supplier
                accounts can submit bids.
              </p>
            </div>
          )}

          <div className="card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              Schedule
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <TimelineRow
                label="Bid Start"
                value={formatDateTime(rfq.bidStartAt)}
              />
              <TimelineRow
                label="Bid Close"
                value={formatDateTime(rfq.bidCloseAt)}
                highlight
              />
              <TimelineRow
                label="Forced Close"
                value={formatDateTime(rfq.forcedBidCloseAt)}
              />
              <TimelineRow
                label="Pickup"
                value={formatDateTime(rfq.pickupDate)}
              />
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "emerald" | "indigo";
}) {
  const toneCls =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "indigo"
        ? "text-brand-600"
        : "text-slate-500";
  return (
    <div className="bg-white px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        <span className={toneCls}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-base font-bold text-slate-900">{value}</div>
      {hint && (
        <div className="text-[11px] text-slate-500">{hint}</div>
      )}
    </div>
  );
}

function TimelineRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={
          "text-right font-medium " +
          (highlight ? "text-brand-700" : "text-slate-800")
        }
      >
        {value}
      </dd>
    </div>
  );
}

function BidHistory({
  bids,
}: {
  bids: {
    id: string;
    totalPrice: unknown;
    submittedAt: Date;
    quoteValidity: Date;
    supplier: { name: string };
  }[];
}) {
  return (
    <section className="card overflow-hidden">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 hover:bg-slate-50">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <History className="h-4 w-4 text-slate-500" />
              Full bid history
            </h2>
            <p className="text-xs text-slate-500">
              Every bid ever placed, newest first.
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500 transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2">Supplier</th>
                <th className="px-5 py-2">Total</th>
                <th className="px-5 py-2">Valid Until</th>
                <th className="px-5 py-2">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bids.map((b) => (
                <tr key={b.id}>
                  <td className="px-5 py-2 font-medium text-slate-900">
                    {b.supplier.name}
                  </td>
                  <td className="px-5 py-2 tabular-nums">
                    {formatCurrency(Number(b.totalPrice))}
                  </td>
                  <td className="px-5 py-2 text-xs text-slate-500">
                    {formatDateTime(b.quoteValidity)}
                  </td>
                  <td className="px-5 py-2 text-xs text-slate-500">
                    {formatDateTime(b.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
