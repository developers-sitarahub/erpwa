/*
  Warnings:

  - Made the column `whatsappMessageId` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "replyToMessageId" TEXT,
ALTER COLUMN "whatsappMessageId" SET NOT NULL;
