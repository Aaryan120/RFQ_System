export interface RankableBid {
  supplierId: string;
  totalPrice: number;
  submittedAt: Date;
}

export interface RankedSupplier {
  supplierId: string;
  rank: number; // 1 = L1 (lowest price)
  totalPrice: number;
}

/**
 * Ranking rules:
 *  - Only each supplier's LATEST bid counts toward their standing.
 *  - Lower totalPrice = better rank. Ties broken by earlier submittedAt (whoever got there first wins).
 */
export function rankBids(bids: RankableBid[]): RankedSupplier[] {
  const latestBySupplier = new Map<string, RankableBid>();
  for (const b of bids) {
    const prev = latestBySupplier.get(b.supplierId);
    if (!prev || b.submittedAt > prev.submittedAt) {
      latestBySupplier.set(b.supplierId, b);
    }
  }

  const ordered = [...latestBySupplier.values()].sort((a, b) => {
    if (a.totalPrice !== b.totalPrice) return a.totalPrice - b.totalPrice;
    return a.submittedAt.getTime() - b.submittedAt.getTime();
  });

  return ordered.map((b, i) => ({
    supplierId: b.supplierId,
    rank: i + 1,
    totalPrice: b.totalPrice,
  }));
}

export function rankMap(ranking: RankedSupplier[]): Map<string, number> {
  return new Map(ranking.map((r) => [r.supplierId, r.rank]));
}

export function anyRankChanged(
  before: RankedSupplier[],
  after: RankedSupplier[],
): boolean {
  const beforeMap = rankMap(before);
  const afterMap = rankMap(after);

  // Any supplier whose rank changed (or is newly present) counts as a change.
  const supplierIds = new Set<string>([...beforeMap.keys(), ...afterMap.keys()]);
  for (const id of supplierIds) {
    if (beforeMap.get(id) !== afterMap.get(id)) return true;
  }
  return false;
}

export function l1Changed(
  before: RankedSupplier[],
  after: RankedSupplier[],
): boolean {
  const beforeL1 = before.find((r) => r.rank === 1)?.supplierId;
  const afterL1 = after.find((r) => r.rank === 1)?.supplierId;
  return beforeL1 !== afterL1;
}
