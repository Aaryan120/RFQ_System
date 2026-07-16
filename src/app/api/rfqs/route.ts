import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncAuctionStatus } from "@/lib/auction/engine";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rfqs = await prisma.rfq.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      config: true,
      bids: { orderBy: { totalPrice: "asc" }, take: 1 },
    },
  });

  // Sync status for anything past its close time.
  await Promise.all(rfqs.map((r) => syncAuctionStatus(r.id)));

  const fresh = await prisma.rfq.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      config: true,
      bids: { orderBy: { totalPrice: "asc" }, take: 1 },
    },
  });

  return NextResponse.json({
    rfqs: fresh.map((r) => ({
      id: r.id,
      referenceId: r.referenceId,
      name: r.name,
      status: r.status,
      bidCloseAt: r.bidCloseAt,
      forcedBidCloseAt: r.forcedBidCloseAt,
      pickupDate: r.pickupDate,
      lowestBid: r.bids[0]?.totalPrice ?? null,
      config: r.config,
    })),
  });
}
