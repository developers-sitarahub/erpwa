/*
  Warnings:

  - You are about to drop the `WebhookLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "direction" TEXT,
ADD COLUMN     "processingMs" INTEGER,
ADD COLUMN     "responseCode" INTEGER,
ALTER COLUMN "vendorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "flowId" TEXT,
ADD COLUMN     "templateType" TEXT NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE "TemplateButton" ADD COLUMN     "flowAction" TEXT,
ADD COLUMN     "flowId" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "whatsappFlowsPrivateKey" TEXT,
ADD COLUMN     "whatsappFlowsPublicKey" TEXT;

-- DropTable
DROP TABLE "WebhookLog";

-- CreateTable
CREATE TABLE "TemplateCarouselCard" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "s3Url" TEXT,
    "mediaHandle" TEXT,
    "mimeType" TEXT,
    "buttonType" TEXT DEFAULT 'URL',
    "buttonText" TEXT,
    "buttonValue" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateCarouselCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateCatalogProduct" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateCatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "triggerKeyword" TEXT,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowSession" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "currentNodeId" TEXT NOT NULL,
    "state" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppFlow" (
    "id" TEXT NOT NULL,
    "metaFlowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "flowJson" JSONB NOT NULL,
    "endpointUri" TEXT,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "deprecatedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowResponse" (
    "id" TEXT NOT NULL,
    "flowId" TEXT,
    "conversationId" TEXT NOT NULL,
    "responseData" JSONB NOT NULL,
    "flowToken" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "FlowResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateCarouselCard_templateId_idx" ON "TemplateCarouselCard"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateCarouselCard_templateId_position_key" ON "TemplateCarouselCard"("templateId", "position");

-- CreateIndex
CREATE INDEX "TemplateCatalogProduct_templateId_idx" ON "TemplateCatalogProduct"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateCatalogProduct_templateId_position_key" ON "TemplateCatalogProduct"("templateId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_vendorId_triggerKeyword_key" ON "Workflow"("vendorId", "triggerKeyword");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppFlow_metaFlowId_key" ON "WhatsAppFlow"("metaFlowId");

-- CreateIndex
CREATE INDEX "WhatsAppFlow_vendorId_idx" ON "WhatsAppFlow"("vendorId");

-- CreateIndex
CREATE INDEX "WhatsAppFlow_metaFlowId_idx" ON "WhatsAppFlow"("metaFlowId");

-- CreateIndex
CREATE INDEX "WhatsAppFlow_status_idx" ON "WhatsAppFlow"("status");

-- CreateIndex
CREATE INDEX "FlowResponse_flowId_idx" ON "FlowResponse"("flowId");

-- CreateIndex
CREATE INDEX "FlowResponse_conversationId_idx" ON "FlowResponse"("conversationId");

-- CreateIndex
CREATE INDEX "FlowResponse_flowToken_idx" ON "FlowResponse"("flowToken");

-- CreateIndex
CREATE INDEX "FlowResponse_status_idx" ON "FlowResponse"("status");

-- CreateIndex
CREATE INDEX "Template_flowId_idx" ON "Template"("flowId");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "WhatsAppFlow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateCarouselCard" ADD CONSTRAINT "TemplateCarouselCard_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateCatalogProduct" ADD CONSTRAINT "TemplateCatalogProduct_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSession" ADD CONSTRAINT "WorkflowSession_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppFlow" ADD CONSTRAINT "WhatsAppFlow_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowResponse" ADD CONSTRAINT "FlowResponse_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "WhatsAppFlow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowResponse" ADD CONSTRAINT "FlowResponse_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
