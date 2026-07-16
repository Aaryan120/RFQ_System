# British Auction RFQ System

Simplified RFQ (Request for Quotation) system with **British Auction–style bidding**: automatic time extensions when bids arrive close to the close, capped by a hard forced-close time.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma**, **PostgreSQL**, **NextAuth v5**, and **Zod**.

- [`docs/HLD.md`](docs/HLD.md) — architecture, sequence diagrams, key decisions
- [`docs/SCHEMA.md`](docs/SCHEMA.md) — database schema + ER diagram

---

## Setup

Prerequisites: **Node 20+**, **npm**, **Docker**.

```bash
# 1. Copy env
cp .env.example .env

# 2. Install deps (generates the Prisma client)
npm install

# 3. Start Postgres
npm run db:up

# 4. Create tables + seed demo data
npm run db:migrate       # first time only (creates the migration)
npm run db:seed

# 5. Run the app
npm run dev
```

App runs at http://localhost:3000.

If you ever want a clean slate:
```bash
npm run db:reset && npm run db:seed
```

### Demo accounts (password `demo123`)

| Email                    | Role     |
| ------------------------ | -------- |
| `buyer@gocomet.com`      | BUYER    |
| `supplier1@gocomet.com`  | SUPPLIER |
| `supplier2@gocomet.com`  | SUPPLIER |
| `supplier3@gocomet.com`  | SUPPLIER |

### Seeded auctions

- `RFQ-DEMO-ACTIVE` — Live auction, close time is inside the trigger window, so the very next bid will extend it.
- `RFQ-DEMO-CLOSED` — Historical closed auction with extension + close activity log.
- `RFQ-DEMO-SCHEDULED` — Not opened yet.

---

## What the app does

**Buyer** (`buyer@gocomet.com`)
- `/rfq/new` — create an RFQ with British-Auction config: `bidStart`, `bidClose`, `forcedBidClose`, `pickup`, trigger window X, extension duration Y, extension trigger type.
- `/auctions` — see all auctions, statuses, lowest bids, live close times.

**Supplier** (`supplier1..3@gocomet.com`)
- `/auctions` — same listing.
- `/auctions/[id]` — submit bids (`carrier`, `freight`, `origin`, `destination`, `transit`, `validity`).
- Bidding form is only shown while the auction is `ACTIVE`.

Every auction detail page shows:
- Current standings ranked by latest bid per supplier (L1/L2/L3…),
- Full bid history,
- Activity log (bids, extensions with reason, close events),
- Live countdown to bid close.

---

## Auction engine (in one page)

Core module: [`src/lib/auction/engine.ts`](src/lib/auction/engine.ts).

**Status transitions** (`computeStatus`):
```
SCHEDULED → ACTIVE (now ≥ bidStartAt)
ACTIVE    → CLOSED       (now ≥ bidCloseAt)
ACTIVE    → FORCE_CLOSED (now ≥ forcedBidCloseAt)
```
`syncAuctionStatus(rfqId)` is called on every page load and every bid to keep the DB status current and to write the corresponding activity log entry the first time it flips.

**Extension algorithm** (`submitBid`):

1. Validate auction is `ACTIVE` and `now < forcedBidCloseAt`.
2. Snapshot rankings BEFORE inserting.
3. Insert bid, log `BID_SUBMITTED`.
4. Compute rankings AFTER.
5. If `now ∈ [bidCloseAt − X, bidCloseAt)`, evaluate the configured trigger:
   - `BID_RECEIVED` → always extend
   - `ANY_RANK_CHANGE` → extend if any supplier's rank changed
   - `L1_RANK_CHANGE` → extend only if L1 supplier changed
6. If triggered: `newClose = min(bidCloseAt + Y, forcedBidCloseAt)`.
7. If `newClose > bidCloseAt`, update `bidCloseAt` and log `TIME_EXTENDED` (with reason + `cappedAtForced` flag).
8. Re-run `computeStatus`; if it now flips to `CLOSED` / `FORCE_CLOSED`, persist and log.

Ranking is by `totalPrice = freight + origin + destination`, using **only each supplier's latest bid**. Ties broken by earliest submission.

---

## Manual test plan (extension scenarios)

The seed data is deliberately set up so the ACTIVE auction demo works out of the box.

### Test 1 — Bid received extension
1. Log in as `supplier3@gocomet.com`.
2. Open `RFQ-DEMO-ACTIVE`. Note the trigger is `ANY_RANK_CHANGE`, close is in ~5 min, window is 10 min.
3. Submit any bid → activity log gets a `TIME_EXTENDED` entry and the bid close jumps by 5 minutes.

### Test 2 — L1 rank change trigger
1. Create a new RFQ with `L1_RANK_CHANGE`, X=10, Y=5, close time 2 minutes from now, forced close 30 minutes from now.
2. Have supplier1 submit a high bid (e.g. 5000). No extension (nothing to change).
3. Have supplier2 submit a bid ABOVE supplier1's (5500). No extension — L1 didn't move.
4. Have supplier2 submit BELOW supplier1's (4000). Extension fires — L1 flipped.

### Test 3 — Forced-close cap
1. Create an RFQ with `BID_RECEIVED`, close 2 min from now, forced close 3 min from now, Y=10.
2. Wait ~90 seconds, then submit a bid. Close was 2 min out, would extend by 10, but is capped at forced-close (~3 min).
3. Activity log shows `cappedAtForced: true`.

### Test 4 — Post-close rejection
1. Wait until the RFQ is `FORCE_CLOSED`.
2. Attempt to submit a bid → API returns `409` with `code=FORCE_CLOSED`.

---

## Project structure

```
GoComet_Project/
├── docs/
│   ├── HLD.md
│   └── SCHEMA.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── rfqs/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           ├── route.ts
│   │   │           └── bids/route.ts
│   │   ├── auctions/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── login/page.tsx
│   │   ├── rfq/new/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auto-refresh.tsx
│   │   ├── bid-form.tsx
│   │   ├── countdown.tsx
│   │   ├── create-rfq-form.tsx
│   │   ├── status-badge.tsx
│   │   └── top-bar.tsx
│   ├── lib/
│   │   ├── actions/rfq.ts
│   │   ├── auction/
│   │   │   ├── engine.ts
│   │   │   ├── ranking.ts
│   │   │   └── validators.ts
│   │   ├── auth-handlers.ts
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── utils.ts
│   ├── types/next-auth.d.ts
│   └── middleware.ts
├── docker-compose.yml
├── .env.example
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```
