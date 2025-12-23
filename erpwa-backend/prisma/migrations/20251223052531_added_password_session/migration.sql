/*
  Warnings:

  - You are about to drop the column `userId` on the `PasswordResetOtp` table. All the data in the column will be lost.
  - Added the required column `sessionId` to the `PasswordResetOtp` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PasswordResetType" AS ENUM ('change_password', 'forgot_password');

-- DropForeignKey
ALTER TABLE "PasswordResetOtp" DROP CONSTRAINT "PasswordResetOtp_userId_fkey";

-- DropIndex
DROP INDEX "PasswordResetOtp_userId_idx";

-- AlterTable
ALTER TABLE "PasswordResetOtp" DROP COLUMN "userId",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PasswordResetSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PasswordResetType" NOT NULL,
    "tokenHash" TEXT,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordResetSession_userId_idx" ON "PasswordResetSession"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetOtp_sessionId_idx" ON "PasswordResetOtp"("sessionId");

-- AddForeignKey
ALTER TABLE "PasswordResetSession" ADD CONSTRAINT "PasswordResetSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetOtp" ADD CONSTRAINT "PasswordResetOtp_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PasswordResetSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
