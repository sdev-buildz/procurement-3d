/*
  Warnings:

  - You are about to drop the column `approvalId` on the `BidLineItem` table. All the data in the column will be lost.
  - You are about to drop the `Approval` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "karan-cloudworx"."Approval" DROP CONSTRAINT "Approval_rfqId_fkey";

-- DropForeignKey
ALTER TABLE "karan-cloudworx"."BidLineItem" DROP CONSTRAINT "BidLineItem_approvalId_fkey";

-- AlterTable
ALTER TABLE "karan-cloudworx"."BidLineItem" DROP COLUMN "approvalId",
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "karan-cloudworx"."Approval";
