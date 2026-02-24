/*
  Warnings:

  - A unique constraint covering the columns `[whatsappPhoneNumberId,metaTemplateName]` on the table `Template` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `whatsappPhoneNumberId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappPhoneNumberId` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Template_vendorId_metaTemplateName_key";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "whatsappPhoneNumberId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "whatsappPhoneNumberId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Message_vendorId_idx" ON "Message"("vendorId");

-- CreateIndex
CREATE INDEX "Message_whatsappPhoneNumberId_idx" ON "Message"("whatsappPhoneNumberId");

-- CreateIndex
CREATE INDEX "Template_whatsappPhoneNumberId_idx" ON "Template"("whatsappPhoneNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_whatsappPhoneNumberId_metaTemplateName_key" ON "Template"("whatsappPhoneNumberId", "metaTemplateName");
