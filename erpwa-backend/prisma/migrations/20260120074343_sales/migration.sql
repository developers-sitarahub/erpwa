-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "createdBy" TEXT;

-- CreateIndex
CREATE INDEX "Campaign_createdBy_idx" ON "Campaign"("createdBy");

-- CreateIndex
CREATE INDEX "Template_createdBy_idx" ON "Template"("createdBy");
