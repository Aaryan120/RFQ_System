import type { Prisma, PrismaClient } from "@prisma/client";
import {
  ActivityEventType,
  ExtensionTrigger,
  RfqStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  anyRankChanged,
  l1Changed,
  rankBids,
  type RankableBid,
  type RankedSupplier,
} from "@/lib/auction/ranking";
import type { SubmitBidInput } from "@/lib/auction/validators";

type Tx = Prisma.TransactionClient | PrismaClient;

// ---------------------------------------------------------------------------
// Status sync
// ---------------------------------------------------------------------------

export function computeStatus(
  rfq: {
    status: RfqStatus;
    bidStartAt: Date;
    bidCloseAt: Date;
    forcedBidCloseAt: Date;
  },
  now: Date = new Date(),
): RfqStatus {
  // Terminal states never regress.
  if (rfq.status === RfqStatus.CLOSED || rfq.status === RfqStatus.FORCE_CLOSED) {
    return rfq.status;
  }

  if (now >= rfq.forcedBidCloseAt) return RfqStatus.FORCE_CLOSED;
  if (now >= rfq.bidCloseAt) return RfqStatus.CLOSED;
  if (now >= rfq.bidStartAt) return RfqStatus.ACTIVE;
  return RfqStatus.SCHEDULED;
}

/**
 * Persist the current status if the DB is out of date. Also writes an
 * activity log entry the first time we transition to CLOSED / FORCE_CLOSED.
 */
export async function syncAuctionStatus(rfqId: string, tx: Tx = prisma) {
  const rfq = await tx.rfq.findUnique({ where: { id: rfqId } });
  if (!rfq) return null;

  const next = computeStatus(rfq);
  if (next === rfq.status) return rfq;

  const updated = await tx.rfq.update({
    where: { id: rfqId },
    data: { status: next },
  });

  if (next === RfqStatus.CLOSED) {
    await tx.activityLog.create({
      data: {
        rfqId,
        eventType: ActivityEventType.AUCTION_CLOSED,
        description: "Auction closed — bid close time reached.",
        metadata: { closedAt: new Date().toISOString() },
      },
    });
  } else if (next === RfqStatus.FORCE_CLOSED) {
    await tx.activityLog.create({
      data: {
        rfqId,
        eventType: ActivityEventType.FORCE_CLOSED,
        description: "Auction force-closed — forced close time reached.",
        metadata: { closedAt: new Date().toISOString() },
      },
    });
  }

  return updated;
}

// ---------------------------------------------------------------------------
// Bid submission with extension logic
// ---------------------------------------------------------------------------

export interface SubmitBidResult {
  bidId: string;
  extension: {
    applied: boolean;
    reason?: string;
    oldCloseAt?: Date;
    newCloseAt?: Date;
    cappedAtForced?: boolean;
  };
  status: RfqStatus;
  ranking: RankedSupplier[];
}

export class AuctionError extends Error {
  constructor(
    public code:
      | "NOT_FOUND"
      | "NOT_ACTIVE"
      | "FORCE_CLOSED"
      | "NOT_STARTED"
      | "CLOSED",
    message: string,
  ) {
    super(message);
  }
}

function decimalToNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(String(value));
}

function toRankableBids(
  bids: Array<{ supplierId: string; totalPrice: unknown; submittedAt: Date }>,
): RankableBid[] {
  return bids.map((b) => ({
    supplierId: b.supplierId,
    totalPrice: decimalToNumber(b.totalPrice),
    submittedAt: b.submittedAt,
  }));
}

function triggerReasonLabel(trigger: ExtensionTrigger): string {
  switch (trigger) {
    case ExtensionTrigger.BID_RECEIVED:
      return "Bid received in trigger window";
    case ExtensionTrigger.ANY_RANK_CHANGE:
      return "Supplier rank changed in trigger window";
    case ExtensionTrigger.L1_RANK_CHANGE:
      return "Lowest bidder (L1) changed in trigger window";
  }
}

export async function submitBid(params: {
  rfqId: string;
  supplierId: string;
  input: SubmitBidInput;
  now?: Date;
}): Promise<SubmitBidResult> {
  const now = params.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const rfq = await tx.rfq.findUnique({
      where: { id: params.rfqId },
      include: { config: true, bids: true },
    });
    if (!rfq) throw new AuctionError("NOT_FOUND", "RFQ not found");
    if (!rfq.config) throw new AuctionError("NOT_FOUND", "Auction config missing");

    // Advance to whatever the current time implies before validating.
    const effectiveStatus = computeStatus(rfq, now);

    if (effectiveStatus === RfqStatus.SCHEDULED) {
      throw new AuctionError("NOT_STARTED", "Auction has not started yet");
    }
    if (effectiveStatus === RfqStatus.FORCE_CLOSED) {
      throw new AuctionError("FORCE_CLOSED", "Auction is force-closed");
    }
    if (effectiveStatus === RfqStatus.CLOSED) {
      throw new AuctionError("CLOSED", "Auction is closed");
    }

    // Bids must strictly land before the forced close.
    if (now >= rfq.forcedBidCloseAt) {
      throw new AuctionError("FORCE_CLOSED", "Auction is past forced close");
    }

    const totalPrice =
      Number(params.input.freightCharges) +
      Number(params.input.originCharges) +
      Number(params.input.destinationCharges);

    // Snapshot rankings BEFORE inserting the new bid.
    const beforeRanking = rankBids(toRankableBids(rfq.bids));

    const newBid = await tx.bid.create({
      data: {
        rfqId: rfq.id,
        supplierId: params.supplierId,
        carrierName: params.input.carrierName,
        freightCharges: params.input.freightCharges.toString(),
        originCharges: params.input.originCharges.toString(),
        destinationCharges: params.input.destinationCharges.toString(),
        transitTimeDays: params.input.transitTimeDays,
        quoteValidity: params.input.quoteValidity,
        totalPrice: totalPrice.toString(),
        submittedAt: now,
      },
    });

    await tx.activityLog.create({
      data: {
        rfqId: rfq.id,
        eventType: ActivityEventType.BID_SUBMITTED,
        description: `${params.input.carrierName} submitted a bid of ${totalPrice.toFixed(2)}`,
        metadata: {
          bidId: newBid.id,
          supplierId: params.supplierId,
          totalPrice,
        },
      },
    });

    const afterRanking = rankBids(
      toRankableBids([
        ...rfq.bids,
        { supplierId: params.supplierId, totalPrice, submittedAt: now },
      ]),
    );

    // ---- Extension evaluation ---------------------------------------------
    const triggerWindowMs = rfq.config.triggerWindowMinutes * 60_000;
    const windowStart = new Date(rfq.bidCloseAt.getTime() - triggerWindowMs);
    const inWindow = now >= windowStart && now < rfq.bidCloseAt;

    let shouldExtend = false;
    let reason = "";
    if (inWindow) {
      switch (rfq.config.extensionTrigger) {
        case ExtensionTrigger.BID_RECEIVED:
          shouldExtend = true;
          reason = triggerReasonLabel(rfq.config.extensionTrigger);
          break;
        case ExtensionTrigger.ANY_RANK_CHANGE:
          shouldExtend = anyRankChanged(beforeRanking, afterRanking);
          if (shouldExtend) reason = triggerReasonLabel(rfq.config.extensionTrigger);
          break;
        case ExtensionTrigger.L1_RANK_CHANGE:
          shouldExtend = l1Changed(beforeRanking, afterRanking);
          if (shouldExtend) reason = triggerReasonLabel(rfq.config.extensionTrigger);
          break;
      }
    }

    let extension: SubmitBidResult["extension"] = { applied: false };
    let finalCloseAt = rfq.bidCloseAt;

    if (shouldExtend) {
      const rawNewClose = new Date(
        rfq.bidCloseAt.getTime() + rfq.config.extensionDurationMinutes * 60_000,
      );
      const cappedAtForced = rawNewClose > rfq.forcedBidCloseAt;
      const newCloseAt = cappedAtForced ? rfq.forcedBidCloseAt : rawNewClose;

      if (newCloseAt > rfq.bidCloseAt) {
        await tx.rfq.update({
          where: { id: rfq.id },
          data: { bidCloseAt: newCloseAt },
        });

        await tx.activityLog.create({
          data: {
            rfqId: rfq.id,
            eventType: ActivityEventType.TIME_EXTENDED,
            description: `Time extended by ${rfq.config.extensionDurationMinutes} min — ${reason}${cappedAtForced ? " (capped at forced close)" : ""}.`,
            metadata: {
              reason,
              trigger: rfq.config.extensionTrigger,
              oldCloseAt: rfq.bidCloseAt.toISOString(),
              newCloseAt: newCloseAt.toISOString(),
              extensionMinutes: rfq.config.extensionDurationMinutes,
              cappedAtForced,
            },
          },
        });

        finalCloseAt = newCloseAt;
        extension = {
          applied: true,
          reason,
          oldCloseAt: rfq.bidCloseAt,
          newCloseAt,
          cappedAtForced,
        };
      }
    }

    // Recompute status now that close time may have moved.
    const nextStatus = computeStatus(
      {
        status: RfqStatus.ACTIVE,
        bidStartAt: rfq.bidStartAt,
        bidCloseAt: finalCloseAt,
        forcedBidCloseAt: rfq.forcedBidCloseAt,
      },
      now,
    );

    if (nextStatus !== RfqStatus.ACTIVE) {
      await tx.rfq.update({
        where: { id: rfq.id },
        data: { status: nextStatus },
      });
      if (nextStatus === RfqStatus.FORCE_CLOSED) {
        await tx.activityLog.create({
          data: {
            rfqId: rfq.id,
            eventType: ActivityEventType.FORCE_CLOSED,
            description: "Auction force-closed — forced close time reached.",
            metadata: {},
          },
        });
      } else if (nextStatus === RfqStatus.CLOSED) {
        await tx.activityLog.create({
          data: {
            rfqId: rfq.id,
            eventType: ActivityEventType.AUCTION_CLOSED,
            description: "Auction closed — bid close time reached.",
            metadata: {},
          },
        });
      }
    }

    return {
      bidId: newBid.id,
      extension,
      status: nextStatus,
      ranking: afterRanking,
    };
  });
}
