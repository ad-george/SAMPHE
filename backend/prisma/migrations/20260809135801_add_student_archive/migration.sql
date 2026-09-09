-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "archiveUntil" TIMESTAMP(3),
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3);
