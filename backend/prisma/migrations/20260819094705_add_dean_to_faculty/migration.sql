/*
  Warnings:

  - A unique constraint covering the columns `[deanId]` on the table `Faculty` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Faculty" ADD COLUMN     "deanId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_deanId_key" ON "Faculty"("deanId");

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_deanId_fkey" FOREIGN KEY ("deanId") REFERENCES "Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
