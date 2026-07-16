import { PrismaClient, Role, RfqStatus, ExtensionTrigger, ActivityEventType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---- Users ---------------------------------------------------------------
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@gocomet.com" },
    update: {},
    create: {
      email: "buyer@gocomet.com",
      name: "Buyer One",
      role: Role.BUYER,
      passwordHash,
    },
  });

  const supplier1 = await prisma.user.upsert({
    where: { email: "supplier1@gocomet.com" },
    update: {},
    create: {
      email: "supplier1@gocomet.com",
      name: "Acme Freight",
      role: Role.SUPPLIER,
      passwordHash,
    },
  });

  const supplier2 = await prisma.user.upsert({
    where: { email: "supplier2@gocomet.com" },
    update: {},
    create: {
      email: "supplier2@gocomet.com",
      name: "Globex Logistics",
      role: Role.SUPPLIER,
      passwordHash,
    },
  });

  const supplier3 = await prisma.user.upsert({
    where: { email: "supplier3@gocomet.com" },
    update: {},
    create: {
      email: "supplier3@gocomet.com",
      name: "Initech Shipping",
      role: Role.SUPPLIER,
      passwordHash,
    },
  });

  // Wipe existing sample RFQs so the seed is idempotent for the demo data.
  await prisma.rfq.deleteMany({
    where: {
      referenceId: { in: ["RFQ-DEMO-ACTIVE", "RFQ-DEMO-CLOSED", "RFQ-DEMO-SCHEDULED"] },
    },
  });

  const now = new Date();
  const min = (m: number) => new Date(now.getTime() + m * 60 * 1000);

  // ---- 1. ACTIVE auction whose close is inside the trigger window ---------
  // Close in 5 min, trigger window 10 min → any bid right now should extend.
  const activeRfq = await prisma.rfq.create({
    data: {
      referenceId: "RFQ-DEMO-ACTIVE",
      name: "Mumbai → Rotterdam FCL (Live Demo)",
      bidStartAt: min(-30),
      bidCloseAt: min(5),
      forcedBidCloseAt: min(60),
      pickupDate: min(60 * 24 * 3),
      status: RfqStatus.ACTIVE,
      createdById: buyer.id,
      config: {
        create: {
          triggerWindowMinutes: 10,
          extensionDurationMinutes: 5,
          extensionTrigger: ExtensionTrigger.ANY_RANK_CHANGE,
        },
      },
      bids: {
        create: [
          {
            supplierId: supplier1.id,
            carrierName: "Acme Ocean Line",
            freightCharges: "2500.00",
            originCharges: "150.00",
            destinationCharges: "200.00",
            transitTimeDays: 21,
            quoteValidity: min(60 * 24 * 7),
            totalPrice: "2850.00",
            submittedAt: min(-20),
          },
          {
            supplierId: supplier2.id,
            carrierName: "Globex Sea Freight",
            freightCharges: "2400.00",
            originCharges: "180.00",
            destinationCharges: "210.00",
            transitTimeDays: 23,
            quoteValidity: min(60 * 24 * 7),
            totalPrice: "2790.00",
            submittedAt: min(-10),
          },
        ],
      },
      activityLogs: {
        create: [
          {
            eventType: ActivityEventType.BID_SUBMITTED,
            description: "Acme Ocean Line submitted a bid of 2850.00",
            metadata: { supplierId: supplier1.id, totalPrice: 2850 },
          },
          {
            eventType: ActivityEventType.BID_SUBMITTED,
            description: "Globex Sea Freight submitted a bid of 2790.00",
            metadata: { supplierId: supplier2.id, totalPrice: 2790 },
          },
        ],
      },
    },
  });

  // ---- 2. CLOSED auction with historical extensions -----------------------
  const closedRfq = await prisma.rfq.create({
    data: {
      referenceId: "RFQ-DEMO-CLOSED",
      name: "Chennai → Hamburg LCL (Archived)",
      bidStartAt: min(-60 * 48),
      bidCloseAt: min(-60 * 3),
      forcedBidCloseAt: min(-60 * 2),
      pickupDate: min(60 * 24 * 10),
      status: RfqStatus.FORCE_CLOSED,
      createdById: buyer.id,
      config: {
        create: {
          triggerWindowMinutes: 15,
          extensionDurationMinutes: 10,
          extensionTrigger: ExtensionTrigger.L1_RANK_CHANGE,
        },
      },
      bids: {
        create: [
          {
            supplierId: supplier1.id,
            carrierName: "Acme Ocean Line",
            freightCharges: "3400.00",
            originCharges: "200.00",
            destinationCharges: "250.00",
            transitTimeDays: 28,
            quoteValidity: min(60 * 24 * 30),
            totalPrice: "3850.00",
            submittedAt: min(-60 * 5),
          },
          {
            supplierId: supplier2.id,
            carrierName: "Globex Sea Freight",
            freightCharges: "3300.00",
            originCharges: "220.00",
            destinationCharges: "260.00",
            transitTimeDays: 30,
            quoteValidity: min(60 * 24 * 30),
            totalPrice: "3780.00",
            submittedAt: min(-60 * 4),
          },
          {
            supplierId: supplier3.id,
            carrierName: "Initech Global",
            freightCharges: "3200.00",
            originCharges: "230.00",
            destinationCharges: "240.00",
            transitTimeDays: 27,
            quoteValidity: min(60 * 24 * 30),
            totalPrice: "3670.00",
            submittedAt: min(-60 * 3 - 5),
          },
        ],
      },
      activityLogs: {
        create: [
          {
            eventType: ActivityEventType.TIME_EXTENDED,
            description: "L1 changed (Initech Global became lowest). Extended by 10 min.",
            metadata: { extensionMinutes: 10, reason: "L1_RANK_CHANGE" },
          },
          {
            eventType: ActivityEventType.FORCE_CLOSED,
            description: "Reached forced close time — auction force-closed.",
            metadata: {},
          },
        ],
      },
    },
  });

  // ---- 3. SCHEDULED auction that has not opened yet -----------------------
  const scheduledRfq = await prisma.rfq.create({
    data: {
      referenceId: "RFQ-DEMO-SCHEDULED",
      name: "Delhi → New York Air Freight (Upcoming)",
      bidStartAt: min(60 * 24),
      bidCloseAt: min(60 * 24 + 60 * 2),
      forcedBidCloseAt: min(60 * 24 + 60 * 3),
      pickupDate: min(60 * 24 * 7),
      status: RfqStatus.SCHEDULED,
      createdById: buyer.id,
      config: {
        create: {
          triggerWindowMinutes: 5,
          extensionDurationMinutes: 3,
          extensionTrigger: ExtensionTrigger.BID_RECEIVED,
        },
      },
    },
  });

  console.log("Seed complete.");
  console.log("Demo login password:", DEMO_PASSWORD);
  console.log("Users:", [buyer.email, supplier1.email, supplier2.email, supplier3.email]);
  console.log("Sample RFQs:", [activeRfq.referenceId, closedRfq.referenceId, scheduledRfq.referenceId]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
