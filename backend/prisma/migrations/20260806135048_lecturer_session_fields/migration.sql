/*
  Warnings:

  - You are about to drop the column `browserFingerprint` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `browserInfo` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `calculatedDistance` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `deviceInfo` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `osInfo` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `registrationNumber` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `studentGpsAccuracy` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `studentLatitude` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `studentLongitude` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `studentName` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `submissionTime` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `validationFlags` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceDuration` on the `AttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceRadius` on the `AttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `AttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the column `lecturerGpsAccuracy` on the `AttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the column `lecturerLatitude` on the `AttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the column `lecturerLongitude` on the `AttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the column `sessionToken` on the `AttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `AttendanceSession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `AttendanceSession` will be added. If there are existing duplicate values, this will fail.
  - The required column `token` was added to the `AttendanceSession` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `admissionYear` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AttendanceRecord_sessionId_registrationNumber_key";

-- DropIndex
DROP INDEX "AttendanceRecord_sessionId_studentId_key";

-- DropIndex
DROP INDEX "AttendanceSession_sessionToken_key";

-- AlterTable
ALTER TABLE "AttendanceRecord" DROP COLUMN "browserFingerprint",
DROP COLUMN "browserInfo",
DROP COLUMN "calculatedDistance",
DROP COLUMN "deviceInfo",
DROP COLUMN "osInfo",
DROP COLUMN "registrationNumber",
DROP COLUMN "studentGpsAccuracy",
DROP COLUMN "studentLatitude",
DROP COLUMN "studentLongitude",
DROP COLUMN "studentName",
DROP COLUMN "submissionTime",
DROP COLUMN "validationFlags",
ADD COLUMN     "distance" DOUBLE PRECISION,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AttendanceSession" DROP COLUMN "attendanceDuration",
DROP COLUMN "attendanceRadius",
DROP COLUMN "endTime",
DROP COLUMN "lecturerGpsAccuracy",
DROP COLUMN "lecturerLatitude",
DROP COLUMN "lecturerLongitude",
DROP COLUMN "sessionToken",
DROP COLUMN "startTime",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "gpsLocation" TEXT,
ADD COLUMN     "radius" INTEGER NOT NULL DEFAULT 75,
ADD COLUMN     "token" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "admissionYear" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StudyYear" ADD COLUMN     "universityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_token_key" ON "AttendanceSession"("token");
