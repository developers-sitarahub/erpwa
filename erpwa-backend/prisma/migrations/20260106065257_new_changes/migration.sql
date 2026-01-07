/*
  Warnings:

  - Added the required column `mimeType` to the `TemplateMedia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TemplateLanguage" ADD COLUMN     "headerExampleUrl" TEXT,
ADD COLUMN     "headerFilename" TEXT;

-- AlterTable
ALTER TABLE "TemplateMedia" ADD COLUMN     "mimeType" TEXT NOT NULL;
