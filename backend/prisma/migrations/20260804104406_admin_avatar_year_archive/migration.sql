-- AlterTable
ALTER TABLE "AcademicYear" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" SET DEFAULT 'INACTIVE';

-- AlterTable
ALTER TABLE "UniversityAdmin" ADD COLUMN     "avatar" TEXT;
