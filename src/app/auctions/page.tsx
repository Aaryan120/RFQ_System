import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Clock,
  Flame,
  Gavel,
  Hourglass,
  Plus,
  TrendingDown,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncAuctionStatus } from "@/lib/auction/engine";
import { StatusBadge } from "@/components/status-badge";
import { Countdown } from "@/components/countdown";
import { AutoRefresh } from "@/components/auto-refresh";
import { AuctionFilters } from "@/components/auction-filters";
import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { RfqStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;
  const filter = sp.status as RfqStatus | undefined;

  // Cheap first pass to sync statuses across all rows.
  const all = await prisma.rfq.findMany({ select: { id: true } });
  await Promise.all(all.map((r) => syncAuctionStatus(r.id)));

  const [rfqs, allForStats] = await Promise.all([
    prisma.rfq.findMany({
      where: filter ? { status: filter } : undefined,
      orderBy: [{ status: "asc" }, { bidCloseAt: "asc" }],
      include: {
        config: true,
        bids: { orderBy: { totalPrice: "asc" }, take: 1 },
        _count: { select: { bids: true } },
      },
    }),
    prisma.rfq.findMany({
      select: { status: true, forcedBidCloseAt: true, bidCloseAt: true },
    }),
  ]);

  const counts = {
    ALL: allForStats.length,
    ACTIVE: allForStats.filter((r) => r.status === "ACTIVE").length,
    SCHEDULED: allForStats.filter((r) => r.status === "SCHEDULED").length,
    CLOSED: allForStats.filter((r) => r.status === "CLOSED").length,
    FORCE_CLOSED: allForStats.filter((r) => r.status === "FORCE_CLOSED").length,
  };

  const now = Date.now();
  const closingSoon = allForStats.filter(
    (r) =>
      r.status === "ACTIVE" && r.bidCloseAt.getTime() - now < 15 * 60 * 1000,
  ).length;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalSeconds={15} />

      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Auction dashboard
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            British Auctions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            All RFQs with British-Auction bidding, ranked and live.
          </p>
        </div>
        {session.user.role === "BUYER" && (
          <Link
            href="/rfq/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            New RFQ
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total auctions"
          value={counts.ALL}
          icon={<Gavel className="h-4 w-4" />}
          tone="indigo"
        />
        <StatCard
          label="Live now"
          value={counts.ACTIVE}
          hint={counts.ACTIVE > 0 ? "Accepting bids" : "Nothing active"}
          icon={<Flame className="h-4 w-4" />}
          tone="emerald"
        />
        <StatCard
          label="Closing < 15 min"
          value={closingSoon}
          hint={closingSoon > 0 ? "Watch closely" : "None imminent"}
          icon={<Hourglass className="h-4 w-4" />}
          tone={closingSoon > 0 ? "amber" : "default"}
        />
        <StatCard
          label="Scheduled"
          value={counts.SCHEDULED}
          hint="Not yet open"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <AuctionFilters counts={counts} />

      {/* Auction grid */}
      {rfqs.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Gavel className="h-6 w-6" />
          </div>
          <div className="text-sm font-medium text-slate-700">
            No auctions match this filter.
          </div>
          {session.user.role === "BUYER" && (
            <Link
              href="/rfq/new"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Create the first one
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rfqs.map((r) => {
            const lowest = r.bids[0]?.totalPrice
              ? Number(r.bids[0].totalPrice)
              : null;
            const closingSoonRow =
              r.status === "ACTIVE" &&
              r.bidCloseAt.getTime() - now < 15 * 60 * 1000;
            return (
              <Link
                key={r.id}
                href={`/auctions/${r.id}`}
                className="group card card-hover flex flex-col overflow-hidden p-0 animate-fade-in"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-4">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      {r.referenceId}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-base font-semibold text-slate-900">
                      {r.name}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 text-sm">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Lowest Bid
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-lg font-bold tabular-nums text-slate-900">
                      {lowest !== null ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-emerald-600" />
                          {formatCurrency(lowest)}
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {r._count.bids} bid{r._count.bids === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {r.status === "ACTIVE" ? "Closes in" : "Bid Close"}
                    </div>
                    <div
                      className={
                        "mt-0.5 text-sm font-semibold " +
                        (closingSoonRow ? "text-amber-700" : "text-slate-900")
                      }
                    >
                      {r.status === "ACTIVE" ? (
                        <Countdown target={r.bidCloseAt} />
                      ) : (
                        formatDateTime(r.bidCloseAt)
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      Forced: {formatDateTime(r.forcedBidCloseAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-[11px]">
                  <span className="font-medium text-slate-600">
                    X={r.config?.triggerWindowMinutes}m · Y=
                    {r.config?.extensionDurationMinutes}m ·{" "}
                    <span className="text-slate-500">
                      {r.config?.extensionTrigger}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-brand-600 group-hover:underline">
                    Open
                    <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
