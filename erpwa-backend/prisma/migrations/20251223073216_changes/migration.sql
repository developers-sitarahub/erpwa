/*
  Warnings:

  - You are about to drop the column `attempts` on the `PasswordResetOtp` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `PasswordResetOtp` table. All the data in the column will be lost.
  - You are about to drop the `PasswordResetSession` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `PasswordResetOtp` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PasswordResetOtp" DROP CONSTRAINT "PasswordResetOtp_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordResetSession" DROP CONSTRAINT "PasswordResetSession_userId_fkey";

-- DropIndex
DROP INDEX "PasswordResetOtp_sessionId_idx";

-- AlterTable
ALTER TABLE "PasswordResetOtp" DROP COLUMN "attempts",
DROP COLUMN "sessionId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "PasswordResetSession";

-- DropEnum
DROP TYPE "PasswordResetType";

-- CreateIndex
CREATE INDEX "PasswordResetOtp_userId_idx" ON "PasswordResetOtp"("userId");

-- AddForeignKey
ALTER TABLE "PasswordResetOtp" ADD CONSTRAINT "PasswordResetOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
