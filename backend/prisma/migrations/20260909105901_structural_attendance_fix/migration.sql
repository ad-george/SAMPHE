-- AlterTable
ALTER TABLE "AttendanceSession" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "lecturerGpsAccuracy" DOUBLE PRECISION,
ADD COLUMN     "lecturerLatitude" DOUBLE PRECISION,
ADD COLUMN     "lecturerLongitude" DOUBLE PRECISION;
