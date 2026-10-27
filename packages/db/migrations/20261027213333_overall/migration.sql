-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "karan-cloudworx";

-- CreateEnum
CREATE TYPE "karan-cloudworx"."UserRole" AS ENUM ('BUYER', 'SUPPLIER', 'SALES_ENGINEER', 'ADMIN');

-- CreateEnum
CREATE TYPE "karan-cloudworx"."RegionCode" AS ENUM ('VIETNAM', 'INDIA', 'CHINA', 'GLOBAL');

-- CreateEnum
CREATE TYPE "karan-cloudworx"."RfqStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'AWARDED');

-- CreateEnum
CREATE TYPE "karan-cloudworx"."ComplianceStatus" AS ENUM ('PENDING', 'VERIFIED', 'FLAGGED');

-- CreateTable
CREATE TABLE "karan-cloudworx"."users1" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "karan-cloudworx"."UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users1_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karan-cloudworx"."Buyer" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karan-cloudworx"."Supplier" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "country" "karan-cloudworx"."RegionCode" NOT NULL,
    "complianceStatus" "karan-cloudworx"."ComplianceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karan-cloudworx"."SalesEngineer" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesEngineer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karan-cloudworx"."3dLayout" (
    "id" SERIAL NOT NULL,
    "projectName" TEXT NOT NULL,
    "salesEngineerId" INTEGER NOT NULL,
    "sceneGraphData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "3dLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karan-cloudworx"."Rfq" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "karan-cloudworx"."RfqStatus" NOT NULL DEFAULT 'DRAFT',
    "bidClosingDate" TIMESTAMP(3) NOT NULL,
    "deliveryDeadline" TIMESTAMP(3) NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karan-cloudworx"."RfqEntry" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "partId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RfqEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karan-cloudworx"."VehiclePart" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "vehicleModelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehiclePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karan-cloudworx"."VehicleModel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karan-cloudworx"."Bid" (
    "id" SERIAL NOT NULL,
    "technicalNotes" TEXT,
    "rfqId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karan-cloudworx"."BidLineItem" (
    "id" SERIAL NOT NULL,
    "leadTimeWeeks" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "technicalNotes" TEXT,
    "approvalId" INTEGER NOT NULL,
    "bidId" INTEGER NOT NULL,
    "rfqLineItemId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BidLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karan-cloudworx"."Approval" (
    "id" SERIAL NOT NULL,
    "decision" BOOLEAN NOT NULL,
    "justification" TEXT,
    "rfqId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users1_email_key" ON "karan-cloudworx"."users1"("email");

-- CreateIndex
CREATE INDEX "users1_email_idx" ON "karan-cloudworx"."users1"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_userId_key" ON "karan-cloudworx"."Buyer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_userId_key" ON "karan-cloudworx"."Supplier"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_taxId_key" ON "karan-cloudworx"."Supplier"("taxId");

-- CreateIndex
CREATE INDEX "Supplier_country_idx" ON "karan-cloudworx"."Supplier"("country");

-- CreateIndex
CREATE INDEX "Supplier_complianceStatus_idx" ON "karan-cloudworx"."Supplier"("complianceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SalesEngineer_userId_key" ON "karan-cloudworx"."SalesEngineer"("userId");

-- CreateIndex
CREATE INDEX "Rfq_status_idx" ON "karan-cloudworx"."Rfq"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VehiclePart_name_key" ON "karan-cloudworx"."VehiclePart"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_name_key" ON "karan-cloudworx"."VehicleModel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_rfqId_supplierId_key" ON "karan-cloudworx"."Bid"("rfqId", "supplierId");

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."Buyer" ADD CONSTRAINT "Buyer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "karan-cloudworx"."users1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."Supplier" ADD CONSTRAINT "Supplier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "karan-cloudworx"."users1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."SalesEngineer" ADD CONSTRAINT "SalesEngineer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "karan-cloudworx"."users1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."3dLayout" ADD CONSTRAINT "3dLayout_salesEngineerId_fkey" FOREIGN KEY ("salesEngineerId") REFERENCES "karan-cloudworx"."SalesEngineer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."Rfq" ADD CONSTRAINT "Rfq_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "karan-cloudworx"."Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."RfqEntry" ADD CONSTRAINT "RfqEntry_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "karan-cloudworx"."Rfq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."RfqEntry" ADD CONSTRAINT "RfqEntry_partId_fkey" FOREIGN KEY ("partId") REFERENCES "karan-cloudworx"."VehiclePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."VehiclePart" ADD CONSTRAINT "VehiclePart_vehicleModelId_fkey" FOREIGN KEY ("vehicleModelId") REFERENCES "karan-cloudworx"."VehicleModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."Bid" ADD CONSTRAINT "Bid_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "karan-cloudworx"."Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."Bid" ADD CONSTRAINT "Bid_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "karan-cloudworx"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."BidLineItem" ADD CONSTRAINT "BidLineItem_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "karan-cloudworx"."Approval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."BidLineItem" ADD CONSTRAINT "BidLineItem_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "karan-cloudworx"."Bid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."BidLineItem" ADD CONSTRAINT "BidLineItem_rfqLineItemId_fkey" FOREIGN KEY ("rfqLineItemId") REFERENCES "karan-cloudworx"."RfqEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karan-cloudworx"."Approval" ADD CONSTRAINT "Approval_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "karan-cloudworx"."Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;
