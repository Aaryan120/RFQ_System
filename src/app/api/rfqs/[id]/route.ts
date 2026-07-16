import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncAuctionStatus } from "@/lib/auction/engine";
import { rankBids } from "@/lib/auction/ranking";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await syncAuctionStatus(id);

  const rfq = await prisma.rfq.findUnique({
    where: { id },
    include: {
      config: true,
      bids: { include: { supplier: true }, orderBy: { submittedAt: "desc" } },
      activityLogs: { orderBy: { createdAt: "desc" } },
      createdBy: true,
    },
  });

  if (!rfq) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ranking = rankBids(
    rfq.bids.map((b) => ({
      supplierId: b.supplierId,
      totalPrice: Number(b.totalPrice),
      submittedAt: b.submittedAt,
    })),
  );

  return NextResponse.json({ rfq, ranking });
}
