/*
  Warnings:

  - You are about to drop the column `admissionYear` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `programmeId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `registrationNumber` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `programmeId` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Unit` table. All the data in the column will be lost.
  - Added the required column `studyYearId` to the `Semester` table without a default value. This is not possible if the table is not empty.
  - Added the required column `universityId` to the `Semester` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regNo` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programId` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_programmeId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_programmeId_fkey";

-- DropIndex
DROP INDEX "Student_registrationNumber_key";

-- AlterTable
ALTER TABLE "Programme" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "Semester" ADD COLUMN     "studyYearId" TEXT NOT NULL,
ADD COLUMN     "universityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "admissionYear",
DROP COLUMN "phone",
DROP COLUMN "programmeId",
DROP COLUMN "registrationNumber",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "departmentId" TEXT NOT NULL,
ADD COLUMN     "programId" TEXT NOT NULL,
ADD COLUMN     "regNo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "programmeId",
DROP COLUMN "updatedAt",
ADD COLUMN     "programId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "_StudentUnits" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_LecturerUnits" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_StudentUnits_AB_unique" ON "_StudentUnits"("A", "B");

-- CreateIndex
CREATE INDEX "_StudentUnits_B_index" ON "_StudentUnits"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_LecturerUnits_AB_unique" ON "_LecturerUnits"("A", "B");

-- CreateIndex
CREATE INDEX "_LecturerUnits_B_index" ON "_LecturerUnits"("B");

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_studyYearId_fkey" FOREIGN KEY ("studyYearId") REFERENCES "StudyYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentUnits" ADD CONSTRAINT "_StudentUnits_A_fkey" FOREIGN KEY ("A") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentUnits" ADD CONSTRAINT "_StudentUnits_B_fkey" FOREIGN KEY ("B") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LecturerUnits" ADD CONSTRAINT "_LecturerUnits_A_fkey" FOREIGN KEY ("A") REFERENCES "Lecturer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LecturerUnits" ADD CONSTRAINT "_LecturerUnits_B_fkey" FOREIGN KEY ("B") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
