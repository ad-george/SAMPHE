/*
  Warnings:

  - Added the required column `universityId` to the `AcademicYear` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AcademicYear" ADD COLUMN "universityId" TEXT NOT NULL DEFAULT 'some-existing-university-id';

-- AlterTable
ALTER TABLE "University" ADD COLUMN     "licenseRevoked" BOOLEAN NOT NULL DEFAULT false;
