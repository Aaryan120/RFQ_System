-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'CLOSED', 'FORCE_CLOSED');

-- CreateEnum
CREATE TYPE "ExtensionTrigger" AS ENUM ('BID_RECEIVED', 'ANY_RANK_CHANGE', 'L1_RANK_CHANGE');

-- CreateEnum
CREATE TYPE "ActivityEventType" AS ENUM ('BID_SUBMITTED', 'TIME_EXTENDED', 'AUCTION_CLOSED', 'FORCE_CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rfq" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bidStartAt" TIMESTAMP(3) NOT NULL,
    "bidCloseAt" TIMESTAMP(3) NOT NULL,
    "forcedBidCloseAt" TIMESTAMP(3) NOT NULL,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "status" "RfqStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionConfig" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "triggerWindowMinutes" INTEGER NOT NULL,
    "extensionDurationMinutes" INTEGER NOT NULL,
    "extensionTrigger" "ExtensionTrigger" NOT NULL,

    CONSTRAINT "AuctionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "carrierName" TEXT NOT NULL,
    "freightCharges" DECIMAL(14,2) NOT NULL,
    "originCharges" DECIMAL(14,2) NOT NULL,
    "destinationCharges" DECIMAL(14,2) NOT NULL,
    "transitTimeDays" INTEGER NOT NULL,
    "quoteValidity" TIMESTAMP(3) NOT NULL,
    "totalPrice" DECIMAL(14,2) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "eventType" "ActivityEventType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Rfq_referenceId_key" ON "Rfq"("referenceId");

-- CreateIndex
CREATE INDEX "Rfq_status_idx" ON "Rfq"("status");

-- CreateIndex
CREATE INDEX "Rfq_bidCloseAt_idx" ON "Rfq"("bidCloseAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionConfig_rfqId_key" ON "AuctionConfig"("rfqId");

-- CreateIndex
CREATE INDEX "Bid_rfqId_totalPrice_idx" ON "Bid"("rfqId", "totalPrice");

-- CreateIndex
CREATE INDEX "Bid_rfqId_submittedAt_idx" ON "Bid"("rfqId", "submittedAt");

-- CreateIndex
CREATE INDEX "ActivityLog_rfqId_createdAt_idx" ON "ActivityLog"("rfqId", "createdAt");

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionConfig" ADD CONSTRAINT "AuctionConfig_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;
