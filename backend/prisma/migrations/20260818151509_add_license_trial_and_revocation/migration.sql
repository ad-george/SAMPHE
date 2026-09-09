-- AlterTable
ALTER TABLE "License" ADD COLUMN     "accessBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gracePeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "isTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UniversityAdmin" ADD COLUMN     "accessBlockedAt" TIMESTAMP(3),
ADD COLUMN     "licenseRevoked" BOOLEAN NOT NULL DEFAULT false;
