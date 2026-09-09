-- DropIndex
DROP INDEX "License_universityId_key";

-- AlterTable
ALTER TABLE "License" ADD COLUMN     "previousStatus" TEXT,
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "startDate" DROP DEFAULT;
