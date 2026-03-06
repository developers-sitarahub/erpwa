/*
  Warnings:

  - You are about to drop the column `campaignLimit` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `chatbotLimit` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `formLimit` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `galleryLimit` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `leadLimit` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `planType` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `templateLimit` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the `SubscriptionPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "campaignLimit",
DROP COLUMN "chatbotLimit",
DROP COLUMN "formLimit",
DROP COLUMN "galleryLimit",
DROP COLUMN "leadLimit",
DROP COLUMN "planType",
DROP COLUMN "templateLimit";

-- DropTable
DROP TABLE "SubscriptionPlan";
