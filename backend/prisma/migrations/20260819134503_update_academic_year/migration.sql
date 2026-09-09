/*
  Warnings:

  - A unique constraint covering the columns `[universityId,staffNumber]` on the table `Hod` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[universityId,email]` on the table `Hod` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Hod_email_key";

-- DropIndex
DROP INDEX "Hod_staffNumber_key";

-- AlterTable
ALTER TABLE "AcademicYear" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Hod" ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Hod_universityId_staffNumber_key" ON "Hod"("universityId", "staffNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Hod_universityId_email_key" ON "Hod"("universityId", "email");
