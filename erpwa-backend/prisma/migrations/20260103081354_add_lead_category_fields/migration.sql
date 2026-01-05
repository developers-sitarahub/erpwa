-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "salesPersonName" TEXT,
ADD COLUMN     "subCategoryId" INTEGER;

-- CreateIndex
CREATE INDEX "Lead_categoryId_idx" ON "Lead"("categoryId");

-- CreateIndex
CREATE INDEX "Lead_subCategoryId_idx" ON "Lead"("subCategoryId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
