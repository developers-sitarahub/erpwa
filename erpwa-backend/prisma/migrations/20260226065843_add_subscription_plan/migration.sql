-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "templateLimit" INTEGER NOT NULL DEFAULT 10,
    "campaignLimit" INTEGER NOT NULL DEFAULT 5,
    "chatbotLimit" INTEGER NOT NULL DEFAULT 2,
    "leadLimit" INTEGER NOT NULL DEFAULT 500,
    "galleryLimit" INTEGER NOT NULL DEFAULT 50,
    "formLimit" INTEGER NOT NULL DEFAULT 5,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");
