/*
  Warnings:

  - Added the required column `updatedAt` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "University" ADD COLUMN     "integrationConfig" JSONB,
ADD COLUMN     "integrationMode" TEXT NOT NULL DEFAULT 'STANDALONE',
ADD COLUMN     "lastSyncAt" TIMESTAMP(3);
