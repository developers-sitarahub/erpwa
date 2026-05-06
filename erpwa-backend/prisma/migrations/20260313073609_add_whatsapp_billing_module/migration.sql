-- CreateTable
CREATE TABLE "WhatsappMessage" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "waMessageId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "conversationId" TEXT,
    "messageType" TEXT,
    "status" TEXT,
    "pricingCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappConversation" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metaCost" DOUBLE PRECISION NOT NULL,
    "chargedCost" DOUBLE PRECISION NOT NULL,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappPricing" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "service" DOUBLE PRECISION NOT NULL,
    "utility" DOUBLE PRECISION NOT NULL,
    "marketing" DOUBLE PRECISION NOT NULL,
    "authentication" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WhatsappPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorWallet" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappMessage_waMessageId_key" ON "WhatsappMessage"("waMessageId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_vendorId_idx" ON "WhatsappMessage"("vendorId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_vendorId_createdAt_idx" ON "WhatsappMessage"("vendorId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsappMessage_phoneNumber_idx" ON "WhatsappMessage"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappConversation_conversationId_key" ON "WhatsappConversation"("conversationId");

-- CreateIndex
CREATE INDEX "WhatsappConversation_vendorId_idx" ON "WhatsappConversation"("vendorId");

-- CreateIndex
CREATE INDEX "WhatsappConversation_vendorId_createdAt_idx" ON "WhatsappConversation"("vendorId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsappConversation_category_idx" ON "WhatsappConversation"("category");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappPricing_country_key" ON "WhatsappPricing"("country");

-- CreateIndex
CREATE UNIQUE INDEX "VendorWallet_vendorId_key" ON "VendorWallet"("vendorId");

-- CreateIndex
CREATE INDEX "WalletTransaction_vendorId_idx" ON "WalletTransaction"("vendorId");

-- CreateIndex
CREATE INDEX "WalletTransaction_vendorId_createdAt_idx" ON "WalletTransaction"("vendorId", "createdAt");
