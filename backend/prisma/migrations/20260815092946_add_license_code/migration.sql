/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `License` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `License` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_universityId_fkey";

-- AlterTable
ALTER TABLE "License" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "usedBy" TEXT,
ALTER COLUMN "universityId" DROP NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'SUBSCRIPTION',
ALTER COLUMN "status" SET DEFAULT 'UNUSED';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "License_code_key" ON "License"("code");

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
