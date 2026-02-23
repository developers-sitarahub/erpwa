/*
  Warnings:

  - You are about to drop the column `otpHash` on the `RegistrationOTP` table. All the data in the column will be lost.
  - Added the required column `email` to the `RegistrationOTP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailOtpHash` to the `RegistrationOTP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobileOtpHash` to the `RegistrationOTP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RegistrationOTP" DROP COLUMN "otpHash",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "emailOtpHash" TEXT NOT NULL,
ADD COLUMN     "mobileOtpHash" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "RegistrationOTP_email_idx" ON "RegistrationOTP"("email");
