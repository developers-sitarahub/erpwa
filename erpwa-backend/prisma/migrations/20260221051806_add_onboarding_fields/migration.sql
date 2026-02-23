/*
  Warnings:

  - A unique constraint covering the columns `[mobileNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mobileNumber" TEXT,
ADD COLUMN     "onboardingStatus" TEXT NOT NULL DEFAULT 'pending',
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "businessAttributes" JSONB,
ADD COLUMN     "businessCategory" TEXT,
ADD COLUMN     "country" TEXT;

-- CreateTable
CREATE TABLE "RegistrationOTP" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationOTP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistrationOTP_mobile_idx" ON "RegistrationOTP"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobileNumber_key" ON "User"("mobileNumber");
