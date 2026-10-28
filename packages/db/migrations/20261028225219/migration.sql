/*
  Warnings:

  - You are about to drop the `blog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "default-schema"."blog" DROP CONSTRAINT "blog_user_id_fkey";

-- AlterTable
ALTER TABLE "karan-cloudworx"."Supplier" ADD COLUMN     "onboardingData" JSONB;

-- DropTable
DROP TABLE "default-schema"."blog";

-- DropTable
DROP TABLE "default-schema"."product";

-- DropTable
DROP TABLE "default-schema"."users";
